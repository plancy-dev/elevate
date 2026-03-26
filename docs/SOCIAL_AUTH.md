# Social login (Google & Microsoft) — checklist

Your app uses `signInWithOAuth` with redirect to **`/auth/callback`**. The **Supabase project** must match the provider consoles.

## 1. URLs (every environment)

| Where | URL |
|-------|-----|
| Supabase **Callback URL** (shown in provider settings) | `https://<PROJECT_REF>.supabase.co/auth/v1/callback` |
| Your app (Vercel) | `https://<your-domain>/auth/callback` |

Add **Site URL** and **Redirect URLs** under **Authentication → URL Configuration**:

- `http://localhost:3000` (dev)
- `https://<production-domain>` (Vercel)

Include **`/auth/callback`** on each origin you use.

---

## 2. Google Cloud Console

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID (Web application).
2. **Authorized redirect URIs** — add exactly:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. **Supabase → Authentication → Providers → Google**
   - **Client IDs**: paste the **OAuth 2.0 Client ID** string.  
     **Do not include spaces.** If you have multiple client IDs, use **commas only** (no spaces).
   - **Client secret**: paste the client secret from the same OAuth client.

---

## 3. Microsoft Entra ID (Azure)

1. [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID** → **App registrations** → your app.
2. **Authentication** → **Add a platform** → Web → add redirect URI:
   - `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. **Certificates & secrets** → **New client secret** → copy the **Value** (not the “Secret ID” row). Paste that into Supabase **Secret Value**.
4. **Application (client) ID** → copy into Supabase **Application (client) ID**.
5. **Azure Tenant URL** in Supabase (see [Supabase Azure docs](https://supabase.com/docs/guides/auth/social-login/auth-azure#azure-tenant-url)):
   - Single-tenant example: `https://login.microsoftonline.com/<tenant-id>`
   - Or use the directory (tenant) ID from Entra overview.

Save until all validation errors are gone.

---

## 4. Same email = one account (account linking)

Supabase can **merge** OAuth identities when the **email matches** an existing user (e.g. email/password first, then Google with the same email).

1. In **Supabase Dashboard** → **Authentication** → **Settings** (or **Providers** / advanced), enable options such as:
   - **Automatic account linking** (wording may vary by project version), **or**
   - Follow [Identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking).

2. Requirements (typical):
   - **Email is unique** across users.
   - **Verified email** on the existing account before linking is safe (reduces takeover risk).

3. **Manual linking** (optional): enable **manual identity linking** in Auth settings if you want the app’s **Settings → Connected accounts** “Link Google / Microsoft” buttons to work. Those use `linkIdentity()` after the user is already signed in.

---

## 5. Your SQL (admin role)

After the user exists in **Authentication** and `public.profiles` is created by the trigger:

```sql
update public.profiles
set role = 'admin'
where email = 'gmj1197@gmail.com';
```

You already ran this for `gmj1197@gmail.com` — no app code change required.
