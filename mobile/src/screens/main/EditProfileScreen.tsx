import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types';

type EditProfileScreenNavigationProp = StackNavigationProp<
    ProfileStackParamList,
    'EditProfile'
>;

interface Props {
    navigation: EditProfileScreenNavigationProp;
}

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, setUser } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await userService.updateProfile({ firstName, lastName });

            if (user) {
                const updatedUser = { ...user, firstName, lastName };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter your first name"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter your last name"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={styles.helperText}>Email cannot be changed</Text>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        flexGrow: 1,
    },
    form: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: -12,
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default EditProfileScreen;
