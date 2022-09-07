# SSO User Manager
 
O aplicativo visa facilitar a administração de grupos de usuários.

Layout do arquivo .env:
```
NEXT_PUBLIC_KC_URL=http://localhost:8180/auth
NEXT_PUBLIC_KC_REALM=demo
NEXT_PUBLIC_KC_CLIENT_ID=next-auth
NEXT_PUBLIC_KC_CLIENT_SECRET=c340cc01-0609-4464-8419-f88f49187462
NEXT_PUBLIC_KC_USER_ROLE=user
NEXT_PUBLIC_KC_ADMIN_ROLE=admin

KC_CLIENT_ID=client-users-manager
KC_CLIENT_SECRET=51349cef-81f9-4324-b2f7-c76cbb8d5636

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ykpvlWAO7u9NkOwEYEVSCz0WlT+L3M5EGY/FVh2lIuY=

NEXT_PUBLIC_pageSize=50
```

Run dev:
```
npm run dev
```

Deploy serverless: 
Após definir as chaves da aws, (via arquivos na pasta .aws ou variáveis de ambiente)

```
sls --debug
```