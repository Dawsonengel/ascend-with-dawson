import { Tabs } from "expo-router";

import { theme } from "@/components/Theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.subtleText,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
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
