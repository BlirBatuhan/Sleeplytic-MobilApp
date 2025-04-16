import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Hoş Geldin</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput placeholder="E-posta" style={styles.input} />
        <TextInput placeholder="Şifre" style={styles.input} secureTextEntry />
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>Hesabın yok mu? Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 50,
    },
    logo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 10,
    },
    inputContainer: {
      width: '80%',
    },
    input: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    loginButton: {
      backgroundColor: '#4a90e2',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
    },
    loginButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
    registerButton: {
      alignItems: 'center',
    },
    registerButtonText: {
      color: '#4a90e2',
      fontSize: 14,
    },
  });

