/**
 * Browser: 결제위젯 클라이언트 키 (`NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY`).
 * Server 승인: 위젯 결제는 `TOSS_WIDGET_SECRET_KEY` 우선, 없으면 API 개별 `TOSS_SECRET_KEY`.
 */
export function getTossWidgetClientKey(): string | null {
  return process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY?.trim() || null;
}

export function getTossConfirmSecretKey(): string | null {
  return (
    process.env.TOSS_WIDGET_SECRET_KEY?.trim() ||
    process.env.TOSS_SECRET_KEY?.trim() ||
    null
  );
}
