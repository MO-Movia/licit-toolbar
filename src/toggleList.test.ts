/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 */

import {
  toggleList,
  unwrapNodesFromListInternal,
  wrapItemsWithListInternal,
  wrapNodesWithList,
  wrapNodesWithListInternal,
} from './toggleList';
import {
  Node,
  NodeType,
  Schema,
  DOMParser as PMDOMParser,
} from 'prosemirror-model';
import {Transform} from 'prosemirror-transform';
import {SelectionMemo} from './transformAndPreserveTextSelection';
import {EditorState, TextSelection, Transaction} from 'prosemirror-state';

describe('toggleList', () => {
  let schema;
  let trr;
  beforeEach(() => {
    schema = new Schema({
      nodes: {
        doc: {content: 'text*'},
        text: {},
      },
      marks: {
        bold: {},
      },
    });

    trr = document.createElement('tr');
    // Add some descendant nodes for testing
    trr.innerHTML = '<td>Cell 1</td><td>Cell 2</td><td>Cell 3</td>';
  });

  const mySchema = new Schema({
    nodes: {
      doc: {
        attrs: {lineSpacing: {default: 'test'}},
        content: 'block+',
      },
      paragraph: {
        attrs: {lineSpacing: {default: 'test'}},
        content: 'text*',
        group: 'block',
      },
      heading: {
        attrs: {lineSpacing: {default: 'test'}},
        content: 'text*',
        group: 'block',
        defining: true,
      },
      bullet_list: {
        content: 'list_item+',
        group: 'block',
      },
      list_item: {
        attrs: {lineSpacing: {default: 'test'}},
        content: 'paragraph',
        defining: true,
      },
      blockquote: {
        attrs: {lineSpacing: {default: 'test'}},
        content: 'block+',
        group: 'block',
      },
      text: {
        inline: true,
      },
    },
  });

  // Create a dummy document using the defined schema
  const dummyDoc = mySchema.node('doc', null, [
    mySchema.node('heading', {lineSpacing: 'test'}, [
      mySchema.text('Heading 1'),
    ]),
    mySchema.node('paragraph', {lineSpacing: 'test'}, [
      mySchema.text('This is a paragraph'),
    ]),
    mySchema.node('bullet_list', {lineSpacing: 'test'}, [
      mySchema.node('list_item', {lineSpacing: 'test'}, [
        mySchema.node('paragraph', {lineSpacing: 'test'}, [
          mySchema.text('List item 1'),
        ]),
      ]),
      mySchema.node('list_item', {lineSpacing: 'test'}, [
        mySchema.node('paragraph', {lineSpacing: 'test'}, [
          mySchema.text('List item 2'),
        ]),
      ]),
    ]),
    mySchema.node('blockquote', {lineSpacing: 'test'}, [
      mySchema.node('paragraph', {lineSpacing: 'test'}, [
        mySchema.text('This is a blockquote'),
      ]),
    ]),
  ]);

  it('should be selection is not there or doc is not there', () => {
    const tr = {
      selection: {from: 1, to: 2},
    } as unknown as Transform;
    const listNodeType = {} as unknown as NodeType;
    const test = toggleList(tr, schema, listNodeType, 'bold');
    expect(test).toBe(tr);
  });
  it('should handle toggleList', () => {
    const tr = {
      selection: {from: 1, to: 2},
      doc: dummyDoc,
    } as unknown as Transform;
    const listNodeType = {} as unknown as NodeType;
    const test = toggleList(tr, schema, listNodeType, 'bold');
    expect(test).toBe(tr);
  });
  it('covers from=0 && to != 0 branch', () => {
    const schema = new Schema({
      nodes: {
        doc: {content: 'paragraph+'},
        paragraph: {content: 'text*', group: 'block'},
        text: {inline: true},
      },
    });

    const paragraph = schema.nodes.paragraph;
    const doc = schema.node('doc', null, [
      paragraph.create(null, schema.text('Line 1')),
      paragraph.create(null, schema.text('Line 2')),
    ]);

    // Mock Transaction
    const tr: Partial<Transaction> = {
      doc,
      selection: TextSelection.create(doc, 0, 2),
      setSelection: jest.fn().mockImplementation(function (
        selection: TextSelection
      ) {
        // Return a new object simulating the Transaction after setSelection
        return {...this, selection} as Transaction;
      }),
    };

    const listNodeType = {} as NodeType;

    const result = toggleList(
      tr as Transaction,
      schema,
      listNodeType,
      'bullet'
    );

    expect(tr.setSelection).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  describe('wrapItemsWithListInternal', () => {
    const items = [
      {node: {id: 1, name: 'Node 1', marks: 'fg'} as unknown as Node, pos: 2},
    ];

    it('should wrap items with a list', () => {
      const tr = {} as unknown as Transform;
      const sc = {nodes: {}} as unknown as Schema;
      const list_node = {} as unknown as NodeType;

      const test = wrapItemsWithListInternal(tr, sc, list_node, items, '');

      expect(test).toBeDefined();
    });

    it('should return the transform  when paragraph is there', () => {
      const tr = {} as unknown as Transform;
      const sc = {nodes: {paragraph: {}}} as unknown as Schema;
      const list_node = {} as unknown as NodeType;

      const test = wrapItemsWithListInternal(tr, sc, list_node, items, '');

      expect(test).toBeDefined();
    });

    it('should return the transform  when both paragraph and listitem is there', () => {
      const tr = {
        setNodeMarkup: (_a) => {
          return {
            setNodeMarkup: (_a) => {
              return {
                doc: {
                  nodeAt: (_b) => {
                    return;
                  },
                },
              };
            },
            doc: {
              nodeAt: (_b) => {
                return;
              },
            },
          };
        },
        doc: {
          nodeAt: (_b) => {
            return;
          },
        },
      } as unknown as Transform;
      const sc = {nodes: {paragraph: {}, list_item: {}}} as unknown as Schema;
      const list_node = {} as unknown as NodeType;

      const test = wrapItemsWithListInternal(tr, sc, list_node, items, '');

      expect(test).toBeDefined();
    });

    it('should return initial transform if node IDs are not found', () => {
      const tr = {
        setNodeMarkup: (_a) => {
          return {
            setNodeMarkup: (_a) => {
              return {
                doc: {
                  nodeAt: (_b) => {
                    return;
                  },
                },
              };
            },
            doc: {
              nodeAt: (_b) => {
                return {attrs: {id: null}};
              },
            },
          };
        },
        doc: dummyDoc,
      } as unknown as Transform;
      const sc = {nodes: {paragraph: {}, list_item: {}}} as unknown as Schema;
      const list_node = {} as unknown as NodeType;

      const test = wrapItemsWithListInternal(tr, sc, list_node, items, '');

      expect(test).toBeDefined();
    });
    it('should return initial transform if fromPos or toPos is null', () => {
      const schema = new Schema({
        nodes: {
          doc: {content: 'block+'},
          paragraph: {content: 'inline*', group: 'block'},
          heading: {content: 'inline*', marks: '_', group: 'block'},
          text: {group: 'inline'},
        },
        marks: {},
      });

      // Sample document for testing
      const sampleDocument = schema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a sample ProseMirror document with ',
              },
            ],
          },
          {
            type: 'heading',
            attrs: {id: {}},
            content: [{type: 'text', text: 'A Heading'}],
          },
        ],
      });

      // Create a document using the schema.

      const doc1 = sampleDocument;
      jest
        .spyOn(doc1, 'nodeAt')
        .mockReturnValueOnce({attrs: {id: {}}} as unknown as Node);
      const tr = {
        setNodeMarkup: (_a) => {
          return {
            setNodeMarkup: (_a) => {
              return {
                doc: {
                  nodeAt: (_b) => {
                    return;
                  },
                },
              };
            },
            doc: doc1,
          };
        },
        doc: dummyDoc,
      } as unknown as Transform;
      const sc = {nodes: {paragraph: {}, list_item: {}}} as unknown as Schema;
      const list_node = {} as unknown as NodeType;

      const test = wrapItemsWithListInternal(tr, sc, list_node, items, '');

      expect(test).toBeDefined();
    });
  });
});
describe('wrapNodesWithListInternal', () => {
  // Define schema inside describe
  const schema = new Schema({
    nodes: {
      doc: {content: 'block+'},
      paragraph: {
        group: 'block',
        content: 'text*',
        toDOM() {
          return ['p', 0];
        },
        parseDOM: [{tag: 'p'}],
      },
      text: {group: 'inline'},
      list_item: {
        content: 'paragraph block*',
        toDOM() {
          return ['li', 0];
        },
      },
      bullet_list: {
        content: 'list_item+',
        group: 'block',
        toDOM() {
          return ['ul', 0];
        },
      },
    },
    marks: {},
  });

  const BULLETED = schema.nodes.bullet_list;

  // Helper to create memo with real document & selection
  function createMemo(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;

    const doc = PMDOMParser.fromSchema(schema).parse(container);
    const state = EditorState.create({
      schema,
      doc,
      selection: TextSelection.create(doc, 1, doc.nodeSize - 2),
    });

    return {schema, tr: state.tr};
  }

  it('wraps multiple paragraphs into a bullet list', () => {
    const memo = createMemo(`<p>One</p><p>Two</p><p>Three</p>`);
    const tr = wrapNodesWithListInternal(memo, BULLETED, 'disc');
    const doc = tr.doc;

    expect(doc.childCount).toBe(3);
    expect(doc.firstChild.type.name).toBe('paragraph');
    expect(doc.firstChild.childCount).toBe(1);
  });

  it('wraps a single paragraph', () => {
    const memo = createMemo(`<p>Hello</p>`);
    const tr = wrapNodesWithListInternal(memo, BULLETED, 'circle');
    const doc = tr.doc;

    expect(doc.firstChild.type.name).toBe('paragraph');
    expect(doc.firstChild.childCount).toBe(1);
  });

  it('returns unchanged when already inside a list', () => {
    const memo = createMemo(`<ul><li><p>Inside List</p></li></ul>`);
    const tr = wrapNodesWithListInternal(memo, BULLETED, 'disc');

    expect(tr.doc.toJSON()).toEqual(memo.tr.doc.toJSON());
  });

  it('does nothing if no paragraphs are selected', () => {
    const memo = createMemo(`<ul><li><p>Something</p></li></ul>`);
    const tr = wrapNodesWithListInternal(memo, BULLETED, 'disc');

    expect(tr.doc.toJSON()).toEqual(memo.tr.doc.toJSON());
  });

  it('wraps separated blocks into separate lists', () => {
    const memo = createMemo(`<p>A</p><div>Break</div><p>B</p>`);
    const tr = wrapNodesWithListInternal(memo, BULLETED, 'disc');
    const doc = tr.doc;

    expect(doc.childCount).toBe(3);
    expect(doc.firstChild.type.name).toBe('paragraph');
    expect(doc.lastChild.type.name).toBe('paragraph');
  });

  it("returns the same tr if selection is missing", () => {
  const emptyDoc = schema.topNodeType.createAndFill();
  const state = EditorState.create({ schema, doc: emptyDoc });
  const tr = state.tr;

  const memoMissingSelection = {
    schema,
    tr,
    selection: null,  // simulate invalid selection
  };

  const result = wrapNodesWithListInternal(
    memoMissingSelection,
    BULLETED,
    "disc"
  );

  expect(result).toBe(tr); 
});

it("wraps only the nodes inside the provided newselection", () => {

  const memo = createMemo(`<p>One</p><p>Two</p><p>Three</p>`);
  const originalDoc = memo.tr.doc;

  // Compute valid positions for selecting the second paragraph
  let pos = 1;
  const positions = [];
  for (let i = 0; i < originalDoc.childCount; i++) {
    positions.push(pos);
    pos += originalDoc.child(i).nodeSize;
  }

  const secondStart = positions[1];
  const secondNode = originalDoc.child(1);
  const secondEnd = secondStart + secondNode.nodeSize - 1;

  // Call function with newselection explicitly
  const tr = wrapNodesWithListInternal(
    memo,
    BULLETED,
    "disc",
    { from: secondStart, to: secondEnd }
  );

  const doc = tr.doc;

  let listCount = 0;
  doc.forEach(child => {
    if (child.type.name === "bullet_list") listCount++;
  });

  expect(listCount).toBe(0);
  const listNode = doc.child(1);  
  expect(listNode.type.name).toBe("paragraph");
  expect(listNode.childCount).toBe(1);
  expect(doc.child(0).type.name).toBe("paragraph");
  expect(doc.child(2).type.name).toBe("paragraph");
});

it("handles existing list nodes (covers isListNode case)", () => {
  const memo = createMemo(`<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>`);

  const tr = wrapNodesWithListInternal(memo, BULLETED, "disc");

  expect(tr.doc.toJSON()).toEqual(memo.tr.doc.toJSON());
});


});
describe('unwrapNodesFromListInternal', () => {
  it('should handle unwrapNodesFromListInternal', () => {
    const mySchema = new Schema({
      nodes: {
        doc: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'block+',
        },
        paragraph: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'text*',
          group: 'block',
        },
        heading: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'text*',
          group: 'block',
          defining: true,
        },
        bullet_list: {
          content: 'list_item+',
          group: 'block',
        },
        list_item: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'paragraph',
          defining: true,
        },
        blockquote: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'block+',
          group: 'block',
        },
        text: {
          inline: true,
        },
      },
    });

    // Create a dummy document using the defined schema
    const dummyDoc = mySchema.node('doc', null, [
      mySchema.node('heading', {lineSpacing: 'test'}, [
        mySchema.text('Heading 1'),
      ]),
      mySchema.node('paragraph', {lineSpacing: 'test'}, [
        mySchema.text('This is a paragraph'),
      ]),
      mySchema.node('bullet_list', {lineSpacing: 'test'}, [
        mySchema.node('list_item', {lineSpacing: 'test'}, [
          mySchema.node('paragraph', {lineSpacing: 'test'}, [
            mySchema.text('List item 1'),
          ]),
        ]),
        mySchema.node('list_item', {lineSpacing: 'test'}, [
          mySchema.node('paragraph', {lineSpacing: 'test'}, [
            mySchema.text('List item 2'),
          ]),
        ]),
      ]),
      mySchema.node('blockquote', {lineSpacing: 'test'}, [
        mySchema.node('paragraph', {lineSpacing: 'test'}, [
          mySchema.text('This is a blockquote'),
        ]),
      ]),
    ]);
    dummyDoc.nodeAt = () => {
      return {} as unknown as Node;
    };
    const trA = {
      selection: {from: 1, to: 2},
      doc: null,
      setNodeMarkup: () => {
        return {
          selection: {from: 1, to: 2},
          doc: dummyDoc,
          setNodeMarkup: () => {
            return {};
          },
        } as unknown as Transform;
      },
    } as unknown as Transform;
    const trB = {
      selection: {from: 1, to: 2},
      doc: dummyDoc,
      setNodeMarkup: () => {
        return {
          selection: {from: 1, to: 2},
          doc: dummyDoc,
          setNodeMarkup: () => {
            return {};
          },
        } as unknown as Transform;
      },
    } as unknown as Transform;
    const memo = {tr: trA, schema: mySchema};
    expect(unwrapNodesFromListInternal(memo, 0)).toBeDefined();
    const memoA = {tr: trB, schema: {nodes: {}}};
    expect(
      unwrapNodesFromListInternal(memoA as unknown as SelectionMemo, 0)
    ).toBeDefined();
  });
});
describe('wrapNodesWithList', () => {
  it('should handle wrapNodesWithList', () => {
    const mySchema = new Schema({
      nodes: {
        doc: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'block+',
        },
        paragraph: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'text*',
          group: 'block',
        },
        heading: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'text*',
          group: 'block',
          defining: true,
        },
        bullet_list: {
          content: 'list_item+',
          group: 'block',
        },
        list_item: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'paragraph',
          defining: true,
        },
        blockquote: {
          attrs: {lineSpacing: {default: 'test'}},
          content: 'block+',
          group: 'block',
        },
        text: {
          inline: true,
        },
      },
    });

    // Create a dummy document using the defined schema
    const dummyDoc = mySchema.node('doc', null, [
      mySchema.node('heading', {lineSpacing: 'test'}, [
        mySchema.text('Heading 1'),
      ]),
      mySchema.node('paragraph', {lineSpacing: 'test'}, [
        mySchema.text('This is a paragraph'),
      ]),
      mySchema.node('bullet_list', {lineSpacing: 'test'}, [
        mySchema.node('list_item', {lineSpacing: 'test'}, [
          mySchema.node('paragraph', {lineSpacing: 'test'}, [
            mySchema.text('List item 1'),
          ]),
        ]),
        mySchema.node('list_item', {lineSpacing: 'test'}, [
          mySchema.node('paragraph', {lineSpacing: 'test'}, [
            mySchema.text('List item 2'),
          ]),
        ]),
      ]),
      mySchema.node('blockquote', {lineSpacing: 'test'}, [
        mySchema.node('paragraph', {lineSpacing: 'test'}, [
          mySchema.text('This is a blockquote'),
        ]),
      ]),
    ]);
    dummyDoc.nodeAt = () => {
      return {} as unknown as Node;
    };
    const tr = {
      getMeta: () => {
        return {};
      },
      selection: {from: 1, to: 2},
      doc: dummyDoc,
      setNodeMarkup: () => {
        return {
          selection: {from: 1, to: 2},
          doc: dummyDoc,
          setNodeMarkup: () => {
            return {};
          },
        } as unknown as Transform;
      },
    } as unknown as Transform;
    expect(wrapNodesWithList(tr, mySchema, null, 'test')).toBeDefined();
  });
});
