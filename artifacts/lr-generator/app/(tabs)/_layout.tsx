import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function TabIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[tabIconStyles.wrap, focused && tabIconStyles.active]}>
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  active: {
    backgroundColor: "rgba(212,168,67,0.15)",
  },
});

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#D4A843",
        tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
        tabBarStyle: isWeb
          ? {
              backgroundColor: "#0A1628",
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.08)",
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            }
          : {
              position: "absolute",
              bottom: 24,
              left: 20,
              right: 20,
              height: 66,
              borderRadius: 33,
              backgroundColor: isIOS ? "transparent" : "rgba(6,12,24,0.94)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              elevation: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              paddingBottom: 10,
              paddingTop: 8,
            },
        tabBarBackground: () =>
          !isWeb && isIOS ? (
            <BlurView
              intensity={75}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 33 }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 9.5,
          letterSpacing: 0.2,
          marginTop: -3,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lrs"
        options={{
          title: "LRs",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="file-text" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "AI Scan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="camera" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sliders" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
