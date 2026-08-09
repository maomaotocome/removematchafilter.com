import { m } from '@/paraglide/messages.js';
import {
  ExampleCompare,
  type ExampleItem,
} from '@/components/matcha/example-compare';

/**
 * Before/after examples (§4.2). Every image in `public/imgs/examples/` was
 * produced by the current build, by driving the real tool in a real browser —
 * regenerate with `pnpm qa:demo` whenever the pipeline changes.
 *
 * Provenance, because §2 forbids passing generated material off as genuine user
 * results: the source photographs are AI-generated (via the `generate-image`
 * skill) specifically for these demos, then matcha-graded by
 * `scripts/qa/make-demo-fixtures.mjs`. `examples.intro` states this on the page.
 * Nothing is third-party media and nothing is presented as a customer's result.
 *
 * Both examples use the safe default preset so the proof represents the first
 * result a visitor actually gets rather than a deliberately extreme setting.
 */
export function Examples() {
  const items: ExampleItem[] = [
    {
      title: m['examples.ex1_title'](),
      body: m['examples.ex1_body'](),
      before: '/imgs/examples/photo-portrait-before.jpg',
      after: '/imgs/examples/photo-portrait-after.jpg',
      beforeWebp: '/imgs/examples/photo-portrait-before.webp',
      afterWebp: '/imgs/examples/photo-portrait-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-portrait-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-portrait-after-480.webp',
      width: 940,
      height: 627,
    },
    {
      title: m['examples.ex2_title'](),
      body: m['examples.ex2_body'](),
      before: '/imgs/examples/photo-flatlay-before.jpg',
      after: '/imgs/examples/photo-flatlay-after.jpg',
      beforeWebp: '/imgs/examples/photo-flatlay-before.webp',
      afterWebp: '/imgs/examples/photo-flatlay-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-flatlay-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-flatlay-after-480.webp',
      width: 940,
      height: 627,
    },
  ];

  return (
    <ExampleCompare
      title={m['examples.title']()}
      intro={m['examples.intro']()}
      honest={m['examples.honest']()}
      beforeLabel={m['examples.before']()}
      afterLabel={m['examples.after']()}
      items={items}
    />
  );
}
