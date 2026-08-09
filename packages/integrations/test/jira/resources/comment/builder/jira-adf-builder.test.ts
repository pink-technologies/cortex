// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraADFBuilder } from '../../../../../src/jira/resources/comment/builder'
import { JiraCommentMentionPlaceholder } from '../../../../../src/jira/resources/comment/models'

describe('JiraADFBuilder', () => {
  it('builds a single-paragraph document from plain text', () => {
    const document = new JiraADFBuilder().addBody('hello').build()

    expect(document).toEqual({
      content: [
        {
          content: [{ text: 'hello', type: 'text' }],
          type: 'paragraph',
        },
      ],
      type: 'doc',
      version: 1,
    })
  })

  it('converts newlines to hard breaks', () => {
    const document = new JiraADFBuilder().addText('a\nb').build()
    const inline = document.content[0].content

    expect(inline).toEqual([
      { text: 'a', type: 'text' },
      { type: 'hardBreak' },
      { text: 'b', type: 'text' },
    ])
  })

  it('replaces the mention placeholder with an ADF mention node', () => {
    const document = new JiraADFBuilder()
      .addBody(`To ${JiraCommentMentionPlaceholder}.`, {
        accountId: 'lead-1',
        displayName: 'Jorge Orjuela',
      })
      .build()

    expect(document.content[0].content).toEqual([
      { text: 'To ', type: 'text' },
      {
        attrs: {
          accessLevel: '',
          id: 'lead-1',
          text: '@Jorge Orjuela',
        },
        type: 'mention',
      },
      { text: '.', type: 'text' },
    ])
  })

  it('keeps an explicit @ on the mention display name', () => {
    const document = new JiraADFBuilder()
      .addMention({ accountId: 'lead-1', displayName: '@Already At' })
      .build()

    expect(document.content[0].content).toEqual([
      {
        attrs: {
          accessLevel: '',
          id: 'lead-1',
          text: '@Already At',
        },
        type: 'mention',
      },
    ])
  })

  it('emits an empty text node when nothing was added', () => {
    const document = new JiraADFBuilder().build()

    expect(document.content[0].content).toEqual([{ text: '', type: 'text' }])
  })

  it('ignores empty text segments', () => {
    const document = new JiraADFBuilder().addText('').addText('ok').build()

    expect(document.content[0].content).toEqual([{ text: 'ok', type: 'text' }])
  })

  it('clears accumulated nodes after build so the instance can be reused', () => {
    const builder = new JiraADFBuilder()

    expect(builder.addBody('first').build().content[0].content).toEqual([{ text: 'first', type: 'text' }])
    expect(builder.addBody('second').build().content[0].content).toEqual([{ text: 'second', type: 'text' }])
  })
})
