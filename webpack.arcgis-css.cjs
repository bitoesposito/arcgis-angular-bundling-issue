/**
 * Custom webpack merge: ArcGIS/Esri CSS + fonts, e esclusione Babel su @arcgis/*
 * (evita URL file:// assoluti da css-loader e classi native rotte da transpile).
 */
module.exports = (config) => {
  const next = { ...config };
  next.module = next.module ?? {};
  next.module.rules = [...(next.module.rules ?? [])];

  const walkRules = (rules, fn) => {
    if (!Array.isArray(rules)) {
      return;
    }
    for (const rule of rules) {
      if (!rule) {
        continue;
      }
      fn(rule);
      if (Array.isArray(rule.oneOf)) {
        walkRules(rule.oneOf, fn);
      }
      if (Array.isArray(rule.rules)) {
        walkRules(rule.rules, fn);
      }
    }
  };

  const arcgisNodeRe = /node_modules[\\/]@arcgis[\\/]/;
  const libtessAsmRe = /node_modules[\\/]@arcgis[\\/]core[\\/]chunks[\\/]libtess-asm\.js$/;

  walkRules(next.module.rules, (rule) => {
    const useEntries = Array.isArray(rule.use)
      ? rule.use
      : rule.use
        ? [rule.use]
        : [];
    const hasAngularBabel = useEntries.some((u) => {
      const loader = typeof u === 'string' ? u : u?.loader;
      if (typeof loader !== 'string') {
        return false;
      }
      return (
        loader.includes('babel-loader') ||
        loader.includes('babel/webpack-loader')
      );
    });
    if (!hasAngularBabel) {
      return;
    }
    const existing = rule.exclude;
    const extras = [arcgisNodeRe, libtessAsmRe];
    rule.exclude = Array.isArray(existing)
      ? [...existing, ...extras]
      : [existing, ...extras].filter(Boolean);
  });

  next.module.rules.push({
    test: /\.(woff2?|ttf|eot|otf)$/i,
    include: [/node_modules[\\/]@arcgis[\\/]/, /node_modules[\\/]@esri[\\/]/],
    type: 'asset/resource',
  });

  next.module.rules.push({
    test: /\.css$/i,
    include: [/node_modules[\\/]@arcgis[\\/]/, /node_modules[\\/]@esri[\\/]/],
    use: [
      require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: {
          esModule: false,
        },
      },
    ],
  });

  return next;
};
