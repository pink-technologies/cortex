// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPHeaders } from '../../src/headers/http-headers'
import { TextSerializer } from '../../src/serializer/text-serializer'
import { createURLRequest } from '../support/url-request'

describe('TextSerializer', () => {
  it('decodes UTF-8 text', () => {
    const body = new TextEncoder().encode('hi')
    expect(
      new TextSerializer().serialize(createURLRequest(), 200, new HTTPHeaders(), body),
    ).toBe('hi')
  })
})
