import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      Alert.alert("Success", "Logged in!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRegister = async () => {
  console.log("REGISTER CLICKED");
  try {
    await register(email, password);
    console.log("REGISTER SUCCESS");
    Alert.alert("Success", "Account created!");
  } catch (error: any) {
    console.log("REGISTER ERROR:", error);
    Alert.alert("Error", error.message);
  }
};

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      <Button title="Login" onPress={handleLogin} />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}