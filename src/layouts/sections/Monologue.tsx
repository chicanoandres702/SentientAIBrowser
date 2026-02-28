// Feature: Layout | Why: Shared neural monologue wrapper for all sub-layouts
import React, { Suspense, lazy } from 'react';
import { LayoutConfig } from '../config/layout.types';

const NeuralMonologue = lazy(() =>
    import('../../features/llm/components/NeuralMonologue/NeuralMonologue')
        .then(m => ({ default: m.NeuralMonologue })),
);

interface Props {
    config: LayoutConfig;
    isAIMode: boolean;
}

/** Conditionally renders NeuralMonologue based on config */
export const Monologue: React.FC<Props> = ({ config, isAIMode }) =>
    config.showNeuralMonologue && isAIMode
        ? <Suspense fallback={null}><NeuralMonologue /></Suspense>
        : null;
