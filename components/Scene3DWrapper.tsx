'use client';

import dynamic from 'next/dynamic';

const BountyX3DScene = dynamic(() => import('./BountyX3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />,
});

export default function Scene3DWrapper() {
  return <BountyX3DScene />;
}
