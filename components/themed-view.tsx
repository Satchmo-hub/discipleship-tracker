export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  // 👇 If no custom background, be transparent
  const resolvedBackground = backgroundColor ?? "transparent";

  return (
    <View
      style={[{ backgroundColor: resolvedBackground }, style]}
      {...otherProps}
    />
  );
}
