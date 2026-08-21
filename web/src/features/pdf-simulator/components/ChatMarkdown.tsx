// web/src/features/pdf-simulator/components/ChatMarkdown.tsx

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { normalizeChatMath } from '../utils/chatHelpers.js'
import 'katex/dist/katex.min.css'

export const ChatMarkdown: React.FC<{ children: string }> = ({ children }) => {
  return (
    <div className="chat-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
        components={{
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {linkChildren}
            </a>
          ),
          table: ({ children: tableChildren }) => (
            <div className="chat-md-table-wrap">
              <table>{tableChildren}</table>
            </div>
          ),
        }}
      >
        {normalizeChatMath(children)}
      </ReactMarkdown>
    </div>
  )
}
