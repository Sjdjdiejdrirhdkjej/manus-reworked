import { Sandpack } from '@codesandbox/sandpack-react';

export default function SandpackRunner() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Sandpack
        template="react"
        theme="auto"
        options={{
          showTabs: true,
          showLineNumbers: true,
          showConsole: true,
          wrapContent: true,
          editorHeight: 420,
          recompileMode: 'delayed',
        }}
      />
    </div>
  );
}