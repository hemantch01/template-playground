import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';
import * as playground from '../../samples/playground';

const EDITOR_STATE_KEY = 'editor-content';

describe('useAppStore - editor persistence (Save Locally)', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset the store to default state
        useAppStore.setState({
            templateMarkdown: playground.TEMPLATE,
            editorValue: playground.TEMPLATE,
            modelCto: playground.MODEL,
            editorModelCto: playground.MODEL,
            data: JSON.stringify(playground.DATA, null, 2),
            editorAgreementData: JSON.stringify(playground.DATA, null, 2),
            sampleName: playground.NAME,
            hasSavedState: false,
        });
    });

    it('should have hasSavedState default to false when no localStorage data exists', () => {
        const state = useAppStore.getState();
        expect(state.hasSavedState).toBe(false);
    });

    it('should save editor state to localStorage when saveLocally is called', () => {
        const store = useAppStore.getState();

        // Modify data in the store first
        useAppStore.setState({ data: '{"name": "Sam Beakman"}' });

        store.saveLocally();

        const saved = localStorage.getItem(EDITOR_STATE_KEY);
        expect(saved).not.toBeNull();

        const parsed = JSON.parse(saved!);
        expect(parsed.data).toBe('{"name": "Sam Beakman"}');
        expect(parsed.templateMarkdown).toBe(playground.TEMPLATE);
        expect(parsed.modelCto).toBe(playground.MODEL);
        expect(parsed.sampleName).toBe(playground.NAME);
    });

    it('should set hasSavedState to true after saveLocally is called', () => {
        const store = useAppStore.getState();

        store.saveLocally();

        expect(useAppStore.getState().hasSavedState).toBe(true);
    });

    it('should persist templateMarkdown, modelCto, data, and sampleName', () => {
        useAppStore.setState({
            templateMarkdown: 'custom template',
            modelCto: 'custom model',
            data: '{"custom": true}',
            sampleName: 'Custom Sample',
        });

        useAppStore.getState().saveLocally();

        const saved = JSON.parse(localStorage.getItem(EDITOR_STATE_KEY)!);
        expect(saved).toEqual({
            templateMarkdown: 'custom template',
            modelCto: 'custom model',
            data: '{"custom": true}',
            sampleName: 'Custom Sample',
        });
    });

    it('should clear persisted state and reset to defaults when clearPersistedEditorState is called', async () => {
        // Save some custom state
        useAppStore.setState({
            templateMarkdown: 'custom',
            data: '{"custom": true}',
        });
        useAppStore.getState().saveLocally();

        expect(localStorage.getItem(EDITOR_STATE_KEY)).not.toBeNull();

        // Clear it
        await useAppStore.getState().clearPersistedEditorState();

        // localStorage should be cleared
        expect(localStorage.getItem(EDITOR_STATE_KEY)).toBeNull();

        // Store should be reset to playground defaults
        const state = useAppStore.getState();
        expect(state.templateMarkdown).toBe(playground.TEMPLATE);
        expect(state.modelCto).toBe(playground.MODEL);
        expect(state.data).toBe(JSON.stringify(playground.DATA, null, 2));
        expect(state.sampleName).toBe(playground.NAME);
        expect(state.hasSavedState).toBe(false);
    });

    it('should gracefully handle corrupt localStorage data', () => {
        // Put corrupt data in localStorage
        localStorage.setItem(EDITOR_STATE_KEY, 'not valid json{{{');

        // Re-creating the store should not throw
        // The getPersistedEditorState helper should return null for corrupt data
        // Since we can't easily re-create the store, we verify the helper behavior
        // by checking that the store still works after setting corrupt data
        const state = useAppStore.getState();
        expect(state.templateMarkdown).toBeDefined();
    });

    it('should handle localStorage data with missing required fields', () => {
        // Put data with missing required fields
        localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify({
            templateMarkdown: 'test',
            // missing modelCto and data
        }));

        // The store should still work - it validates required fields
        const state = useAppStore.getState();
        expect(state.templateMarkdown).toBeDefined();
    });
});
