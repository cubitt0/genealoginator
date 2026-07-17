import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../App';

// SSR smoke test: renders the whole component tree (tree SVG + result panel +
// engine integration), verifying nothing throws and the expected content is produced.
describe('App renders', () => {
  const html = renderToStaticMarkup(<App />);

  it('shows the header and an SVG tree', () => {
    expect(html).toContain('Genealoginator');
    expect(html).toContain('<svg');
  });

  it('labels tiles with capitalized kinship roles, not personal names', () => {
    expect(html).toContain('Wujek');
    expect(html).toContain('Babcia');
    expect(html).toContain('brat matki'); // gloss tooltip for a non-basic relation
  });

  it('starts with no people pre-selected and prompts the user', () => {
    expect(html).toContain('Wybierz'); // hint in the result panel
    expect(html).not.toContain('phrase">'); // no phrase rendered yet
  });
});
