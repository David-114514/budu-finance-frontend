import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api, { errorMessage } from '../api/axios';
import Modal from './Modal';

export default function PasswordDialog({ onClose }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [pending, setPending] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        if (form.newPassword !== form.confirm) {
            setError(t('password.mismatch'));
            return;
        }
        setPending(true);
        try {
            await api.put('/me/password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setDone(true);
        } catch (err) {
            setError(errorMessage(err, t('common.unknownError')));
        } finally {
            setPending(false);
        }
    };

    return (
        <Modal title={t('password.title')} onClose={onClose}>
            {done ? (
                <div className="space-y-4">
                    <p className="text-emerald-700">{t('password.saved')}</p>
                    <button type="button" onClick={onClose} className="w-full bg-blue-600 text-white rounded-2xl py-3 font-medium">
                        {t('common.close')}
                    </button>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <Field label={t('password.current')} value={form.currentPassword} onChange={(value) => setForm({ ...form, currentPassword: value })} />
                    <Field label={t('password.next')} value={form.newPassword} onChange={(value) => setForm({ ...form, newPassword: value })} />
                    <Field label={t('password.confirm')} value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} />
                    {error && <p className="text-sm text-rose-600">{error}</p>}
                    <button type="submit" disabled={pending} className="w-full bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl py-3 font-medium">
                        {pending ? t('common.submitting') : t('password.submit')}
                    </button>
                </form>
            )}
        </Modal>
    );
}

function Field({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
            <input
                type="password"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
                required
            />
        </label>
    );
}
