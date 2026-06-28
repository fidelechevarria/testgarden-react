# @testgarden/react

React & Next.js integration package for [Test Garden](https://testgarden.dev), the zero-config, low-code E2E testing platform.

This package provides a clean, framework-friendly way to integrate the Test Garden tracking and recording script into React-based applications, preventing hydration issues, and adding secure **Automatic Test Authentication** (Auto-Auth Bypass).

---

## Features

- ⚡️ **Zero Hydration Errors**: Dynamically injects the recorder script on the client side only.
- 🔒 **Secure Auto-Auth**: Logs test users in automatically inside the test iframe without saving real passwords or tokens on Test Garden databases.
- 🛠 **Universal Framework Support**: Works seamlessly with Next.js (App Router & Pages Router), Vite, Remix, Create React App, and more.
- 🔌 **Auth Provider Agnostic**: Works with Supabase, Firebase, Auth0, NextAuth, or any custom auth API.

---

## Installation

Install the package via your preferred package manager:

```bash
npm install @testgarden/react
# or
yarn add @testgarden/react
# or
pnpm add @testgarden/react
```

---

## Basic Usage

To integrate Test Garden recorder, import and render `<TestGardenProvider />` at the root of your application (such as in your Root Layout or App entrypoint).

### Next.js (App Router) - `app/layout.tsx`

```tsx
import { TestGardenProvider } from '@testgarden/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Render at the bottom of the body */}
        <TestGardenProvider />
      </body>
    </html>
  );
}
```

### Vite / Standard React - `src/App.tsx`

```tsx
import React from 'react';
import { TestGardenProvider } from '@testgarden/react';

function App() {
  return (
    <div>
      <MyRoutes />
      <TestGardenProvider />
    </div>
  );
}

export default App;
```

---

## Secure Automatic Authentication (Auto-Auth Bypass)

In E2E testing, beginning a test inside the dashboard of your app usually requires recording a login flow (typing email, password, and submitting). This is both tedious to record/playback and poses a security concern if passwords are stored in test logs.

`<TestGardenProvider />` solves this by offering an `onAuthenticate` callback. When the Test Garden Workspace initiates a test run, it requests a specific user role. The package intercepts this request and runs your local authentication logic client-side.

### Implementation Example (Supabase Auth)

```tsx
import { TestGardenProvider } from '@testgarden/react';
import { createClient } from '@/libs/supabase/client'; // Your Supabase Client instance

export default function RootLayout({ children }) {
  const supabase = createClient();

  return (
    <html lang="en">
      <body>
        {children}
        
        <TestGardenProvider
          // 1. Only enable auto-login in local development or staging environments
          enableAutoAuth={process.env.NODE_ENV !== 'production'}
          
          // 2. Define the custom login callback
          onAuthenticate={async (role) => {
            console.log(`Test Garden requested authentication for role: ${role}`);
            
            if (role === 'admin') {
              const { error } = await supabase.auth.signInWithPassword({
                email: 'test-admin@mycompany.com',
                password: process.env.NEXT_PUBLIC_TEST_ADMIN_PASSWORD || 'local_fallback_pass'
              });
              if (error) throw error;
            } else if (role === 'customer') {
              const { error } = await supabase.auth.signInWithPassword({
                email: 'test-customer@mycompany.com',
                password: 'customerpassword123'
              });
              if (error) throw error;
            } else {
              throw new Error(`Unsupported test role: ${role}`);
            }
          }}
        />
      </body>
    </html>
  );
}
```

### How to use it in Test Garden Dashboard

1. Edit your recorded Test Session settings or create a new test.
2. In the initial settings, configure the test runner to set the role parameter (e.g. `tg_auth_role=admin`).
3. When the test runs, Test Garden loads the iframe.
4. The `<TestGardenProvider />` detects the role parameter, displays a loading overlay ("*Autenticando usuario de pruebas...*"), runs your custom `onAuthenticate` login code, updates cookies/localStorage, clears URL params, and notifies Test Garden when authentication is complete.
5. The test starts playing steps immediately on the target URL (e.g. `/dashboard`), pre-authenticated!

---

## API Properties

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `host` | `string` | `'https://test-garden-ten.vercel.app'` | The Test Garden server URL (only override for local testing). |
| `enableAutoAuth` | `boolean` | `false` | Enables checking for auto-auth triggers. Set to false in production! |
| `onAuthenticate` | `(role: string) => Promise<void>` | `undefined` | Callback containing your client-side login logic. |

---

## License

MIT © [Test Garden Team](https://testgarden.dev)