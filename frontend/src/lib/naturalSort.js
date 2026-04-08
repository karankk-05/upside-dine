const naturalTextCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const compareNaturalText = (left, right) =>
  naturalTextCollator.compare(left ?? '', right ?? '');
