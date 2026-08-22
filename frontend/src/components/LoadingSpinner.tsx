export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={`${sizeMap[size]} animate-spin rounded-full border-2 border-white/20 border-t-accent-blue`} />
  );
}
