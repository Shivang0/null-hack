#!/usr/bin/env python3
"""
NULLHACK Daily Podcast Generator

Generates a ~8-9 minute podcast with two hosts (Kai & Lex) covering:
- Agentic AI Security
- Startup Fundings
- Cybersecurity News
- Founder-relevant updates

Uses Claude CLI for transcript + Edge TTS for audio synthesis.
"""

import subprocess
import tempfile
import os
import re
import json
import sys
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Edge TTS voices
KAI_VOICE = "en-US-GuyNeural"       # Male, warm, confident
LEX_VOICE = "en-US-JennyNeural"     # Female, sharp, energetic

OUTPUT_DIR = Path(__file__).parent.parent.parent / "backend" / "priv" / "static" / "podcasts"
TRANSCRIPT_DIR = Path(__file__).parent / "transcripts"

def find_claude():
    """Find the claude CLI binary."""
    import shutil
    path = shutil.which("claude")
    if path:
        return path
    # Fallback paths
    home = os.path.expanduser("~")
    for p in [
        os.path.join(home, ".nvm", "versions", "node", "v20.19.4", "bin", "claude"),
        "/usr/local/bin/claude",
        "/opt/homebrew/bin/claude",
    ]:
        if os.path.exists(p):
            return p
    raise RuntimeError("claude CLI not found")


def generate_transcript(date_str: str) -> str:
    """Use Claude CLI to research news and generate podcast transcript."""

    prompt = f"""You are a podcast script writer for NULLHACK Daily, a tech news podcast.
Today's date: {date_str}

Research and write a podcast script for TWO hosts:
- Kai (male, the security/AI expert — confident, technical, uses analogies)
- Lex (female, the business/startup expert — sharp, energetic, connects dots to business impact)

FORMAT RULES (CRITICAL):
- Use EXACTLY this XML format: <Person1>Kai's dialogue</Person1><Person2>Lex's dialogue</Person2>
- Alternate between Person1 (Kai) and Person2 (Lex)
- Start with ONLY the date, then dive into news. No show name, no "welcome to".
- Target 2000-2200 words total (8-9 minutes when spoken)
- End naturally, no "see you next time" — just close the last topic and stop

CONTENT (cover 5-6 stories from the LAST 24 HOURS):
1. Agentic AI Security — new vulnerabilities, prompt injection attacks, AI agent safety research, MCP security
2. Startup Funding — Series A/B/C rounds, especially European startups, AI companies, cybersecurity startups
3. Cybersecurity — breaches, CVEs, ransomware, zero-days, new tools
4. Founder/Builder News — product launches, open source releases, developer tools
5. Wild Card — one surprising or contrarian story

STYLE:
- Crisp, precise, no filler words
- Kai and Lex react to each other naturally ("That's wild", "Wait, really?", "OK but here's the thing...")
- Include specific numbers, company names, funding amounts
- Each story gets 30-45 seconds of discussion
- Transition between stories naturally

IMPORTANT: Search the web for REAL news from the last 24 hours. Do NOT make up stories. If you cannot find enough recent news, use the most recent stories you know about from your training data, but be honest about dates.

Write the complete script now:"""

    claude_path = find_claude()
    print(f"[podcast] Using Claude CLI at: {claude_path}")
    print(f"[podcast] Generating transcript for {date_str}...")

    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(prompt)
        temp_path = f.name

    try:
        result = subprocess.run(
            [claude_path, "-p", "--verbose"],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            print(f"[podcast] Claude CLI stderr: {result.stderr[:500]}")
            raise RuntimeError(f"Claude CLI failed: {result.stderr[:200]}")

        transcript = result.stdout.strip()
        print(f"[podcast] Transcript generated: {len(transcript)} chars")
        return transcript
    finally:
        os.unlink(temp_path)


def clean_transcript(text: str) -> str:
    """Clean up transcript, remove scratchpad blocks and invalid tags."""
    # Remove scratchpad/code blocks
    text = re.sub(r'```scratchpad\n.*?```\n?', '', text, flags=re.DOTALL)
    text = re.sub(r'```plaintext\n.*?```\n?', '', text, flags=re.DOTALL)
    text = re.sub(r'```\n?', '', text)
    # Remove markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    # Remove any non Person1/Person2 XML tags
    text = re.sub(r'</?(?!(?:Person[12])\b)[^>]+>', '', text)
    # Fix unclosed tags
    text = re.sub(
        r'<Person1>(.*?)(?=<Person[12]>|$)',
        r'<Person1>\1</Person1>',
        text, flags=re.DOTALL
    )
    text = re.sub(
        r'<Person2>(.*?)(?=<Person[12]>|$)',
        r'<Person2>\1</Person2>',
        text, flags=re.DOTALL
    )
    return text.strip()


def parse_dialogue(transcript: str) -> list:
    """Parse transcript into list of (speaker, text) tuples."""
    pattern = r'<Person([12])>(.*?)</Person\1>'
    matches = re.findall(pattern, transcript, re.DOTALL)

    if not matches:
        # Fallback: try to find any Person tags
        lines = transcript.split('\n')
        result = []
        for line in lines:
            line = line.strip()
            if line.startswith('Kai:') or line.startswith('KAI:'):
                result.append(('1', line.split(':', 1)[1].strip()))
            elif line.startswith('Lex:') or line.startswith('LEX:'):
                result.append(('2', line.split(':', 1)[1].strip()))
        if result:
            return result
        # Last resort: treat entire text as Person1
        return [('1', transcript)]

    return [(speaker, text.strip()) for speaker, text in matches]


async def generate_audio_segment(text: str, voice: str, output_path: str):
    """Generate a single audio segment using Edge TTS."""
    import edge_tts

    # Clean text for TTS
    clean_text = re.sub(r'<[^>]+>', '', text)  # Remove any remaining XML
    clean_text = clean_text.strip()
    if not clean_text:
        return

    communicate = edge_tts.Communicate(clean_text, voice)
    await communicate.save(output_path)


async def generate_all_audio(dialogue: list, temp_dir: str) -> list:
    """Generate audio for all dialogue segments."""
    audio_files = []

    for idx, (speaker, text) in enumerate(dialogue):
        if not text.strip():
            continue
        voice = KAI_VOICE if speaker == '1' else LEX_VOICE
        speaker_name = "kai" if speaker == '1' else "lex"
        output_path = os.path.join(temp_dir, f"{idx:03d}_{speaker_name}.mp3")

        print(f"[podcast] TTS segment {idx+1}/{len(dialogue)} ({speaker_name}): {text[:50]}...")
        await generate_audio_segment(text, voice, output_path)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            audio_files.append(output_path)

    return audio_files


def merge_audio(audio_files: list, output_path: str):
    """Merge all audio segments into a single file."""
    from pydub import AudioSegment

    combined = AudioSegment.empty()
    short_pause = AudioSegment.silent(duration=300)   # 300ms between turns

    for f in audio_files:
        segment = AudioSegment.from_file(f, format="mp3")
        combined += segment + short_pause

    # Normalize volume
    combined = combined.normalize()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    combined.export(output_path, format="mp3", bitrate="192k")

    duration_secs = len(combined) / 1000
    print(f"[podcast] Audio merged: {duration_secs:.0f}s ({duration_secs/60:.1f} min)")
    return duration_secs


def generate_episode(date_str: str = None) -> dict:
    """Generate a complete podcast episode."""
    if date_str is None:
        date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

    date_slug = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f"\n{'='*50}")
    print(f" NULLHACK Daily — {date_str}")
    print(f"{'='*50}\n")

    # Step 1: Generate transcript
    raw_transcript = generate_transcript(date_str)

    # Step 2: Clean transcript
    transcript = clean_transcript(raw_transcript)

    # Save transcript
    TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    transcript_path = TRANSCRIPT_DIR / f"episode_{date_slug}.txt"
    with open(transcript_path, 'w') as f:
        f.write(transcript)
    print(f"[podcast] Transcript saved: {transcript_path}")

    # Step 3: Parse dialogue
    dialogue = parse_dialogue(transcript)
    print(f"[podcast] Parsed {len(dialogue)} dialogue segments")

    if not dialogue:
        raise RuntimeError("No dialogue segments parsed from transcript")

    # Step 4: Generate audio
    with tempfile.TemporaryDirectory() as temp_dir:
        audio_files = asyncio.run(generate_all_audio(dialogue, temp_dir))

        if not audio_files:
            raise RuntimeError("No audio segments generated")

        # Step 5: Merge audio
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = OUTPUT_DIR / f"episode_{date_slug}.mp3"
        duration = merge_audio(audio_files, str(output_path))

    # Build episode metadata
    episode = {
        "date": date_slug,
        "title": f"NULLHACK Daily — {date_str}",
        "duration_seconds": int(duration),
        "audio_file": f"episode_{date_slug}.mp3",
        "audio_url": f"/podcasts/episode_{date_slug}.mp3",
        "transcript": transcript,
        "segment_count": len(dialogue),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save metadata
    meta_path = OUTPUT_DIR / f"episode_{date_slug}.json"
    with open(meta_path, 'w') as f:
        json.dump(episode, f, indent=2)

    print(f"\n{'='*50}")
    print(f" Episode complete!")
    print(f" Audio: {output_path}")
    print(f" Duration: {duration/60:.1f} minutes")
    print(f" Segments: {len(dialogue)}")
    print(f"{'='*50}\n")

    return episode


if __name__ == "__main__":
    date = sys.argv[1] if len(sys.argv) > 1 else None
    episode = generate_episode(date)
    # Print JSON to stdout for the Elixir backend to capture
    print("EPISODE_JSON:" + json.dumps(episode))
