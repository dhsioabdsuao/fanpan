'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ResultContent() {
  const searchParams = useSearchParams();
  const entries: [string, string][] = [];
  searchParams.forEach((value, key) => {
    entries.push([key, value]);
  });

  return (
    <div className="flex min-h-full flex-col items-center bg-stone-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">命盘解析</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto">
            {JSON.stringify(Object.fromEntries(entries), null, 2)}
          </pre>
        </CardContent>
      </Card>
      <Link href="/" className="mt-6">
        <Button variant="outline">返回首页</Button>
      </Link>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex min-h-full items-center justify-center">加载中...</div>}>
      <ResultContent />
    </Suspense>
  );
}
