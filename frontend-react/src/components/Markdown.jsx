import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components = {
  p: (props) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
  h1: (props) => <h3 className="text-lg font-bold text-fg mt-4 mb-2" {...props} />,
  h2: (props) => <h3 className="text-lg font-bold text-fg mt-4 mb-2" {...props} />,
  h3: (props) => <h4 className="text-base font-semibold text-fg mt-3 mb-2" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold text-fg" {...props} />,
  em: (props) => <em className="italic text-fg2" {...props} />,
  a: (props) => (
    <a className="text-cyan underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="border-l-2 border-violet pl-4 my-3 text-muted" {...props} />
  ),
  hr: () => <hr className="my-4 border-line" />,
  code: ({ className, children, ...props }) =>
    className ? (
      <code className={`${className} font-mono text-[13px]`} {...props}>
        {children}
      </code>
    ) : (
      <code className="font-mono text-[13px] px-1.5 py-0.5 rounded bg-hover text-cyan" {...props}>
        {children}
      </code>
    ),
  pre: (props) => (
    <pre className="my-3 p-4 rounded-xl bg-inset border border-line overflow-x-auto text-fg2" {...props} />
  ),
  table: (props) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="text-left px-3 py-2 border-b border-line text-fg2 font-semibold" {...props} />
  ),
  td: (props) => <td className="px-3 py-2 border-b border-line/50" {...props} />,
}

export default function Markdown({ children }) {
  return (
    <div className="text-[15px] text-fg2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
