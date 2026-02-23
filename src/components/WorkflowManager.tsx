import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    onSelectWorkflow: (workflowName: string) => void;
}

export const WorkflowManager: React.FC<Props> = ({ onSelectWorkflow }) => {
    // Hardcoded for now, will eventually read from SQLite
    const savedWorkflows = [
        { id: '1', name: 'Swagbucks: Survey Sweeper', description: 'Background 24/7 survey hunter.' },
        { id: '2', name: 'Google: Login Template', description: 'Handles 2FA intervention.' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Saved Workflows</Text>
            {savedWorkflows.map(wf => (
                <TouchableOpacity
                    key={wf.id}
                    style={styles.card}
                    onPress={() => onSelectWorkflow(wf.name)}
                >
                    <Text style={styles.title}>{wf.name}</Text>
                    <Text style={styles.description}>{wf.description}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0066cc',
    },
    description: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    }
});
