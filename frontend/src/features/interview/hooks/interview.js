import { useInterview } from "../interview.context.jsx";

// Re-export as a named hook for the hook layer
const useInterviewHook = () => useInterview();
export default useInterviewHook;
