<h1 align="center"> Stray Animal Detection On Indian Roads Using YoloV8 and Custom CNN <a href="https://iiitr-nov-map-frontend.vercel.app/">(Demo Link)</a> </h1>

![](https://res.cloudinary.com/dq27skoma/image/upload/v1733043340/hlcmd341wmdjnthocog9.png)

This web interface allows the users to see which stray animals (cat, dog, or cow) are present around them at any given instant. There are indicators on the map that depict a heat map indicating the density of stray animals around the user’s location. Panning on the map lets the users see stray animals at multiple locations as well. Our database is polled every 5 seconds and the web app is populated with information about the stray animals in near real-time.  

## Other Codebases for this Web App
1. [Camera Capture Frontend Repository](https://github.com/pooja-gera/iiitr-nov-capture-frontend)
2. [Kaggle Notebook - Finetuned YoloV8](https://www.kaggle.com/code/poojagera00/stray-animal-detection-in-camera-feeds)
3. [Backend Repository](https://github.com/unusualcatcher/animal_detection_api)

## Getting Started With Local Development

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
