This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
"# basemedical" 


# Sequência para Git Flow


## Iniciando o Git Flow
git checkout -b develop
git flow init


## Criação de uma feature
git checkout develop
git checkout -b name-feature

git flow feature start name-feature


## Finalização de uma feature
git checkout develop
git merge name-feature

git flow feature finish name-feature



### Branch Hotfix
##Criação de um Hotfix
git checkout master
git checkout -b name-hotfix

git flow hotfix start name-hotfix

## Finalização de um Hotfix
git checkout master
git merge name-hotfix
git checkout develop
git merge name-hotfix
git tag name-hotfix

git flow hotfix finish name-hotfix



### Branch Release
## Criação de uma Release
git checkout develop
git checkout -b release/1.0.0

git flow release start 1.0.0

## Finalização de uma Release
git checkout master
git merge release/1.0.0
git checkout develop
git merge release/1.0.0
git tag 1.0.0

git flow release finish 1.0.0

git checkout -b secao5aula50
"# courtesyfy" 
# courtesyfy
