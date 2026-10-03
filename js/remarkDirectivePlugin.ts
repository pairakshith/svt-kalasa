/**
 * remarkDirectivePlugin.ts
 * 
 * Unified / Remark plugin specification for custom block (:::) and inline (:) directives.
 * Parses:
 *   - :::translate{id="about.book_info"} ... :::
 *   - :translate[...]{id="about.book_info"}
 *   - :::transliterate{sourceScript="kannada"} ... :::
 *   - :transliterate[...]{sourceScript="kannada"}
 * 
 * Transforms the MDAST directive nodes into HAST HTML elements with:
 *   - data-trans-type="translate" | "transliterate"
 *   - data-trans-id="..."
 *   - data-source-script="..."
 */

import { visit } from 'unist-util-visit';

export interface DirectiveAttributes {
  id?: string;
  sourceScript?: string;
  [key: string]: any;
}

export interface DirectiveNode {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: DirectiveAttributes;
  children?: any[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
    [key: string]: any;
  };
}

export default function remarkDirectivePlugin() {
  return (tree: any) => {
    visit(tree, (node: DirectiveNode) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        const isInline = node.type === 'textDirective';
        const tagName = isInline ? 'span' : 'div';
        const attributes = node.attributes || {};

        if (node.name === 'translate') {
          const data = node.data || (node.data = {});
          data.hName = tagName;
          data.hProperties = {
            ...(data.hProperties || {}),
            'data-trans-type': 'translate',
            ...(attributes.id ? { 'data-trans-id': attributes.id } : {})
          };
        } else if (node.name === 'transliterate') {
          const data = node.data || (node.data = {});
          data.hName = tagName;
          data.hProperties = {
            ...(data.hProperties || {}),
            'data-trans-type': 'transliterate',
            'data-source-script': attributes.sourceScript || 'kannada'
          };
        }
      }
    });
  };
}
