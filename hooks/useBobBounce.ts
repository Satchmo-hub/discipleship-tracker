import { useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export function useBobBounce(active: boolean) {
  const offset = useSharedValue(0);

  if (active) {
    offset.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );
  } else {
    offset.value = withTiming(0, { duration: 200 });
  }

  return offset;
}
