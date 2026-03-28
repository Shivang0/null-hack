<script lang="ts">
  interface Provider {
    slug: string;
    name: string;
    description: string;
    noKey?: boolean;
    recommended?: boolean;
  }

  const FEATURED_PROVIDERS: Provider[] = [
    { slug: 'anthropic',    name: 'Anthropic',      description: 'Claude models — most capable reasoning' },
    { slug: 'ollama-cloud', name: 'Ollama Cloud',   description: 'Managed Ollama — zero infra, instant start',    recommended: true },
    { slug: 'ollama-local', name: 'Ollama Local',   description: 'Run models locally — no API key required',      noKey: true },
    { slug: 'google',       name: 'Google',          description: 'Gemini models — multimodal, long context' },
    { slug: 'groq',         name: 'Groq',            description: 'Ultra-fast inference at low cost' },
    { slug: 'deepseek',     name: 'DeepSeek',        description: 'Strong reasoning, competitive pricing' },
  ];

  const MORE_PROVIDERS: Provider[] = [
    { slug: 'mistral',      name: 'Mistral',         description: 'European open-weight models' },
    { slug: 'cohere',       name: 'Cohere',          description: 'Enterprise NLP and embeddings' },
    { slug: 'together',     name: 'Together AI',     description: 'Open-source models at scale' },
    { slug: 'fireworks',    name: 'Fireworks AI',    description: 'Fast open-source model inference' },
    { slug: 'perplexity',   name: 'Perplexity',      description: 'Search-augmented language models' },
    { slug: 'cerebras',     name: 'Cerebras',        description: 'Wafer-scale AI chip inference' },
    { slug: 'sambanova',    name: 'SambaNova',       description: 'Reconfigurable dataflow architecture' },
    { slug: 'openrouter',   name: 'OpenRouter',      description: 'Unified API for 100+ models' },
    { slug: 'openai',       name: 'OpenAI',          description: 'GPT-4o and o-series models' },
    { slug: 'replicate',    name: 'Replicate',       description: 'Run open-source models via API' },
    { slug: 'xai',          name: 'xAI',             description: 'Grok models from xAI' },
    { slug: 'lambda',       name: 'Lambda',          description: 'GPU cloud for AI workloads' },
    { slug: 'lepton',       name: 'Lepton AI',       description: 'Serverless AI inference platform' },
  ];

  interface Props {
    selectedProviderSlug: string;
    providerKeys: Record<string, string>;
  }

  let {
    selectedProviderSlug = $bindable(),
    providerKeys = $bindable(),
  }: Props = $props();

  let showMoreProviders = $state(false);
</script>

<div class="ob-step">
  <div class="ob-step-icon">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
      <circle cx="10" cy="10" r="7.5"/>
      <path d="M10 6v4l2.5 2.5"/>
    </svg>
  </div>
  <h1 class="ob-title">Choose a Provider</h1>
  <p class="ob-subtitle">Select where your AI models run</p>

  <div class="ob-providers">
    {#each FEATURED_PROVIDERS as p}
      {@const isSelected = selectedProviderSlug === p.slug}
      <button
        class="ob-provider-card"
        class:ob-provider-card--selected={isSelected}
        onclick={() => selectedProviderSlug = p.slug}
      >
        <div class="ob-provider-header">
          <span class="ob-provider-icon">
            {#if p.slug === 'anthropic'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 3L17 17H3L10 3z"/></svg>
            {:else if p.slug === 'ollama-cloud' || p.slug === 'ollama-local'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="10" cy="8" r="4"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"/></svg>
            {:else if p.slug === 'google'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="10" cy="10" r="7.5"/><path d="M10 10h4.5M10 10a4.5 4.5 0 100-4.5H10v4.5z"/></svg>
            {:else if p.slug === 'groq'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10h6M10 7v6"/></svg>
            {:else if p.slug === 'deepseek'}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="10" cy="10" r="3"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.636 5.636l1.414 1.414M12.95 12.95l1.414 1.414M5.636 14.364l1.414-1.414M12.95 7.05l1.414-1.414"/></svg>
            {:else}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
            {/if}
          </span>
          <span class="ob-provider-name">{p.name}</span>
          {#if p.recommended}
            <span class="ob-badge">Recommended</span>
          {/if}
          {#if p.noKey}
            <span class="ob-badge ob-badge--accent">No key needed</span>
          {/if}
        </div>
        <p class="ob-provider-desc">{p.description}</p>
        {#if isSelected && !p.noKey}
          <div class="ob-key-wrap" onclick={(e) => e.stopPropagation()} role="none">
            <input
              class="ob-input ob-input--key"
              type="password"
              placeholder="sk-..."
              value={providerKeys[p.slug] ?? ''}
              oninput={(e) => { providerKeys[p.slug] = (e.currentTarget as HTMLInputElement).value; }}
            />
          </div>
        {/if}
      </button>
    {/each}
  </div>

  <button class="ob-show-more" onclick={() => showMoreProviders = !showMoreProviders}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="transform: rotate({showMoreProviders ? 180 : 0}deg); transition: transform 200ms ease">
      <path d="M4 6l4 4 4-4"/>
    </svg>
    {showMoreProviders ? 'Show fewer' : 'Show more providers'}
  </button>

  {#if showMoreProviders}
    <div class="ob-providers ob-providers--more">
      {#each MORE_PROVIDERS as p}
        {@const isSelected = selectedProviderSlug === p.slug}
        <button
          class="ob-provider-card ob-provider-card--compact"
          class:ob-provider-card--selected={isSelected}
          onclick={() => selectedProviderSlug = p.slug}
        >
          <div class="ob-provider-header">
            <span class="ob-provider-icon">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="3"/></svg>
            </span>
            <span class="ob-provider-name">{p.name}</span>
          </div>
          <p class="ob-provider-desc">{p.description}</p>
          {#if isSelected}
            <div class="ob-key-wrap" onclick={(e) => e.stopPropagation()} role="none">
              <input
                class="ob-input ob-input--key"
                type="password"
                placeholder="API key..."
                value={providerKeys[p.slug] ?? ''}
                oninput={(e) => { providerKeys[p.slug] = (e.currentTarget as HTMLInputElement).value; }}
              />
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ob-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    gap: 0;
  }

  .ob-step-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 auto 1.25rem;
  }

  .ob-title {
    font-size: 1.625rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 0.375rem;
    letter-spacing: -0.02em;
  }

  .ob-subtitle {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0 0 1.75rem;
  }

  .ob-providers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 0.75rem;
  }

  .ob-providers--more {
    grid-template-columns: 1fr 1fr 1fr;
    margin-top: 0.5rem;
  }

  .ob-provider-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ob-provider-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  .ob-provider-card--selected {
    background: rgba(59, 130, 246, 0.07);
    border-color: rgba(59, 130, 246, 0.4);
  }

  .ob-provider-card--compact {
    padding: 0.5rem 0.625rem;
  }

  .ob-provider-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .ob-provider-icon {
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .ob-provider-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #e0e0e0;
    flex: 1;
  }

  .ob-provider-desc {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.35);
    margin: 0;
    line-height: 1.4;
  }

  .ob-badge {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 1px 6px;
    border-radius: 100px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    white-space: nowrap;
  }

  .ob-badge--accent {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.25);
  }

  .ob-show-more {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8125rem;
    cursor: pointer;
    padding: 0.375rem 0;
    transition: color 150ms ease;
    align-self: flex-start;
  }

  .ob-show-more:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  .ob-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    color: #f0f0f0;
    outline: none;
    transition: border-color 150ms ease;
    box-sizing: border-box;
  }

  .ob-input::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  .ob-input:focus {
    border-color: rgba(59, 130, 246, 0.5);
  }

  .ob-input--key {
    margin-top: 0.625rem;
    font-size: 0.875rem;
  }

  .ob-key-wrap {
    width: 100%;
    padding-top: 0.25rem;
  }
</style>
