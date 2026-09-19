import { ChatInputBar } from './components/ChatInputBar';
import { ErrorBanner } from './components/ErrorBanner';
import { GeneratingIndicator } from './components/GeneratingIndicator';
import { RequirementInputCard } from './components/RequirementInputCard';
import { Sidebar } from './components/Sidebar';
import { SparkleIcon } from './components/Icons';
import { SystemMessage } from './components/SystemMessage';
import { TestCaseList } from './components/TestCaseList';
import { TopBar } from './components/TopBar';
import { RequirementFlowProvider, useRequirementFlow } from './context/RequirementFlowContext';
import './App.css';

function AppContent() {
  const {
    stage,
    requirement,
    testCases,
    error,
    submitRequirement,
    regenerate,
    startOver,
    clearError,
  } = useRequirementFlow();

  const showLanding = stage === 'landing' && !requirement;
  const isBusy = stage === 'generating';
  const needsGenerationRetry =
    stage === 'landing' && !!requirement && testCases.length === 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar
          projectName={requirement?.title}
          onStartOver={requirement ? startOver : undefined}
        />
        <div className="app-scroll">
          <div className="app-scroll__inner">
            {showLanding && (
              <div className="app-welcome">
                <div className="app-welcome__icon">
                  <SparkleIcon size={26} />
                </div>
                <h1>Welcome to the world of Test Case Generation.</h1>
                <p>What would you like to do today?</p>
              </div>
            )}

            {error && (
              <ErrorBanner
                message={error}
                onDismiss={clearError}
                onRetry={needsGenerationRetry ? regenerate : undefined}
              />
            )}

            {requirement && (
              <SystemMessage>
                Requirement <strong>&ldquo;{requirement.title}&rdquo;</strong> created
                successfully
                {requirement.originalFileName ? ` from ${requirement.originalFileName}` : ''}.
              </SystemMessage>
            )}

            {isBusy && (
              <GeneratingIndicator
                label={
                  requirement
                    ? 'Generating test cases with AI…'
                    : 'Creating your requirement…'
                }
              />
            )}

            {stage === 'results' && testCases.length > 0 && (
              <>
                <SystemMessage>
                  Test cases are created successfully. Review, edit, and save them below.
                </SystemMessage>
                <TestCaseList />
              </>
            )}

            {showLanding && <RequirementInputCard onSubmit={submitRequirement} />}

            {needsGenerationRetry && (
              <div className="app-retry-card card">
                <p>Test case generation didn&rsquo;t complete. You can try again.</p>
                <button type="button" className="btn btn--primary btn--sm" onClick={regenerate}>
                  Retry generation
                </button>
              </div>
            )}
          </div>
        </div>

        {showLanding && (
          <ChatInputBar
            onSend={(text) => submitRequirement({ title: '', content: text })}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <RequirementFlowProvider>
      <AppContent />
    </RequirementFlowProvider>
  );
}

export default App;
