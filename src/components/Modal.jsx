export default function Modal({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 text-2xl leading-none px-2" aria-label="close">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
