import React from 'react';
import Head from 'next/head';

const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>404 - Sayfa Bulunamadı</title>
      </Head>
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center">
          <h1 className="text-6xl font-bold ">404</h1>
          <p className="text-xl font-medium ">Oops! Sayfa bulunamadı.</p>
          <p className="mt-4">
            <a href="/dashboard" className="px-4 py-2 text-sm ">
              Anasayfaya Dön
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
