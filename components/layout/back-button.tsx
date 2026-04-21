// src/components/layout/back-button.tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  className?: string;
}

export function BackButton({ href = '/dashboard', className = '' }: BackButtonProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <Link 
        href={href} 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground 
                   hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}