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
 * All examples use the safe default preset so the proof represents the first
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
      beforeWebpMedium: '/imgs/examples/photo-portrait-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-portrait-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-portrait-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-portrait-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-portrait-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-portrait-after-1152.webp',
      width: 1280,
      height: 853,
    },
    {
      title: m['examples.ex2_title'](),
      body: m['examples.ex2_body'](),
      before: '/imgs/examples/photo-creator-before.jpg',
      after: '/imgs/examples/photo-creator-after.jpg',
      beforeWebp: '/imgs/examples/photo-creator-before.webp',
      afterWebp: '/imgs/examples/photo-creator-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-creator-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-creator-after-480.webp',
      beforeWebpMedium: '/imgs/examples/photo-creator-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-creator-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-creator-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-creator-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-creator-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-creator-after-1152.webp',
      width: 1280,
      height: 853,
    },
    {
      title: m['examples.ex3_title'](),
      body: m['examples.ex3_body'](),
      before: '/imgs/examples/photo-friends-before.jpg',
      after: '/imgs/examples/photo-friends-after.jpg',
      beforeWebp: '/imgs/examples/photo-friends-before.webp',
      afterWebp: '/imgs/examples/photo-friends-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-friends-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-friends-after-480.webp',
      beforeWebpMedium: '/imgs/examples/photo-friends-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-friends-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-friends-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-friends-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-friends-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-friends-after-1152.webp',
      width: 1280,
      height: 853,
    },
    {
      title: m['examples.ex4_title'](),
      body: m['examples.ex4_body'](),
      before: '/imgs/examples/photo-city-before.jpg',
      after: '/imgs/examples/photo-city-after.jpg',
      beforeWebp: '/imgs/examples/photo-city-before.webp',
      afterWebp: '/imgs/examples/photo-city-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-city-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-city-after-480.webp',
      beforeWebpMedium: '/imgs/examples/photo-city-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-city-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-city-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-city-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-city-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-city-after-1152.webp',
      width: 1280,
      height: 853,
    },
    {
      title: m['examples.ex5_title'](),
      body: m['examples.ex5_body'](),
      before: '/imgs/examples/photo-product-before.jpg',
      after: '/imgs/examples/photo-product-after.jpg',
      beforeWebp: '/imgs/examples/photo-product-before.webp',
      afterWebp: '/imgs/examples/photo-product-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-product-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-product-after-480.webp',
      beforeWebpMedium: '/imgs/examples/photo-product-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-product-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-product-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-product-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-product-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-product-after-1152.webp',
      width: 1280,
      height: 853,
    },
    {
      title: m['examples.ex6_title'](),
      body: m['examples.ex6_body'](),
      before: '/imgs/examples/photo-food-before.jpg',
      after: '/imgs/examples/photo-food-after.jpg',
      beforeWebp: '/imgs/examples/photo-food-before.webp',
      afterWebp: '/imgs/examples/photo-food-after.webp',
      beforeWebpSmall: '/imgs/examples/photo-food-before-480.webp',
      afterWebpSmall: '/imgs/examples/photo-food-after-480.webp',
      beforeWebpMedium: '/imgs/examples/photo-food-before-640.webp',
      afterWebpMedium: '/imgs/examples/photo-food-after-640.webp',
      beforeWebpLarge: '/imgs/examples/photo-food-before-1024.webp',
      afterWebpLarge: '/imgs/examples/photo-food-after-1024.webp',
      beforeWebpRetina: '/imgs/examples/photo-food-before-1152.webp',
      afterWebpRetina: '/imgs/examples/photo-food-after-1152.webp',
      width: 1280,
      height: 853,
    },
  ];

  return (
    <ExampleCompare
      title={m['examples.title']()}
      intro={m['examples.intro']()}
      honest={m['examples.honest']()}
      sceneLabel={m['examples.scene_label']()}
      ctaLabel={m['examples.cta']()}
      beforeLabel={m['examples.before']()}
      afterLabel={m['examples.after']()}
      items={items}
    />
  );
}
