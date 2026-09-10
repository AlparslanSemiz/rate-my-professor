import { type CSSProperties } from '@mantine/core'
import { FULL_PANEL_NAME, LOGO_URL } from '@/constants/branding'

/**
 * The app's launcher icon. Shown wherever the panel names itself — the sidebar header and the
 * login card — so the console and the student app read as one product.
 */
export default function BrandMark({ size = 34 }: { size?: number }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.28),
    flexShrink: 0,
    display: 'block',
    objectFit: 'cover',
  }

  return <img src={LOGO_URL} alt={FULL_PANEL_NAME} width={size} height={size} style={style} />
}
