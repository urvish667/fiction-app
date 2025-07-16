"use client"

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; 
import '@tailwindcss/typography';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose sm:prose-lg font-helvetica text-gray-900 max-w-none mb-8 sm:mb-12">
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
