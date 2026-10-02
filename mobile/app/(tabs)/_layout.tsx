import { Tabs } from "expo-router";
import { useMemo } from "react";

import { useAppTheme } from "@/components/Theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { colors } = useAppTheme();
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      borderTopColor: colors.border,
    }),
    [colors.background, colors.border]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.subtleText,
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: "Blog",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ebook"
        options={{
          title: "Ebook",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="bag.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
