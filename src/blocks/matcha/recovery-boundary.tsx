import { m } from '@/paraglide/messages.js';
import {
  RecoveryTable,
  type RecoveryRow,
} from '@/components/matcha/recovery-table';

export function RecoveryBoundary({
  tone = 'default',
}: {
  tone?: 'default' | 'muted';
}) {
  const rows: RecoveryRow[] = [
    {
      signal: m['recovery.row_1_signal'](),
      outcome: m['recovery.row_1_outcome'](),
      expectation: m['recovery.row_1_expectation'](),
      level: 'good',
    },
    {
      signal: m['recovery.row_2_signal'](),
      outcome: m['recovery.row_2_outcome'](),
      expectation: m['recovery.row_2_expectation'](),
      level: 'good',
    },
    {
      signal: m['recovery.row_3_signal'](),
      outcome: m['recovery.row_3_outcome'](),
      expectation: m['recovery.row_3_expectation'](),
      level: 'partial',
    },
    {
      signal: m['recovery.row_4_signal'](),
      outcome: m['recovery.row_4_outcome'](),
      expectation: m['recovery.row_4_expectation'](),
      level: 'none',
    },
    {
      signal: m['recovery.row_5_signal'](),
      outcome: m['recovery.row_5_outcome'](),
      expectation: m['recovery.row_5_expectation'](),
      level: 'none',
    },
  ];

  return (
    <RecoveryTable
      title={m['recovery.title']()}
      intro={m['recovery.intro']()}
      labels={{
        signal: m['recovery.label_signal'](),
        outcome: m['recovery.label_outcome'](),
        expectation: m['recovery.label_expectation'](),
      }}
      rows={rows}
      tone={tone}
    />
  );
}
