interface SkeletonCardProps {
  height?: string;
  className?: string;
}

export default function SkeletonCard({ height = 'h-32', className = '' }: SkeletonCardProps) {
  return (
    <div className={`skeleton rounded-2xl ${height} ${className}`} />
  );
}
