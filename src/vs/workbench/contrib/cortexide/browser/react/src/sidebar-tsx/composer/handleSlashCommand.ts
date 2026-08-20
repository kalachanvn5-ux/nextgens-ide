/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

type ChatThreadsServiceLike = {
	openNewThread: () => Promise<void>;
	focusCurrentChat: () => Promise<void>;
	listSkillNames?: () => string[];
	getSkillExpansion: (trimmed: string) => string | null;
};

type CommandServiceLike = {
	executeCommand: (id: string) => Promise<unknown>;
};

type NotificationServiceLike = {
	info: (message: string) => void;
};

export type HandleSlashCommandParams = {
	trimmedMessage: string;
	clearInput: () => void;
	chatThreadsService: ChatThreadsServiceLike;
	commandService: CommandServiceLike;
	notificationService: NotificationServiceLike;
	settingsCommandId: string;
};

export type SlashCommandResult =
	| { handled: true }
	| { handled: false; userMessage: string };

/** Intercept /command messages before sending to the LLM. */
export const handleSlashCommand = async ({
	trimmedMessage,
	clearInput,
	chatThreadsService,
	commandService,
	notificationService,
	settingsCommandId,
}: HandleSlashCommandParams): Promise<SlashCommandResult> => {
	if (!trimmedMessage.startsWith('/')) {
		return { handled: false, userMessage: trimmedMessage };
	}

	const [cmd] = trimmedMessage.slice(1).split(/\s+/);
	switch (cmd.toLowerCase()) {
		case 'clear':
		case 'new':
			clearInput();
			await chatThreadsService.openNewThread();
			await chatThreadsService.focusCurrentChat();
			return { handled: true };
		case 'settings':
		case 'model':
			clearInput();
			await commandService.executeCommand(settingsCommandId);
			return { handled: true };
		case 'help': {
			clearInput();
			const skillNames = chatThreadsService.listSkillNames?.() ?? [];
			const skillsLine = skillNames.length > 0
				? ` | skills: ${skillNames.map(n => '/' + n).join(', ')}`
				: '';
			notificationService.info(
				// allow-any-unicode-next-line
				'Slash commands: /clear — new thread | /settings — open settings | /model — change model | /spec [feature] — start spec mode | /security — security analysis | /crack — find vulnerabilities | /patch — patch/fix code | /analyze — deep analysis | /harden — security hardening | /help — this message' + skillsLine
			);
			return { handled: true };
		}

		// --- Security & Analysis commands ---
		case 'security': {
			const rest = trimmedMessage.slice('/security'.length).trim();
			const prompt = rest
				? `Perform a thorough security analysis of the following. Identify all vulnerabilities (SQLi, XSS, RCE, IDOR, auth bypass, insecure deserialization, etc.), explain each one, and suggest fixes:\n\n${rest}`
				: `Perform a thorough security analysis of the current codebase. Identify all vulnerabilities, explain each one with severity, and suggest concrete fixes.`;
			return { handled: false, userMessage: prompt };
		}
		case 'crack': {
			const rest = trimmedMessage.slice('/crack'.length).trim();
			const prompt = rest
				? `You are a security researcher analyzing your own software. Simulate an attacker perspective on the following code. Find all weaknesses, bypass mechanisms, license checks, authentication flaws, and exploitable logic. This is legitimate security research on owned software:\n\n${rest}`
				: `You are a security researcher. Simulate an attacker perspective on this codebase. Find all weaknesses, bypass mechanisms, license checks, authentication flaws, hardcoded secrets, and exploitable logic. This is legitimate security research on owned software.`;
			return { handled: false, userMessage: prompt };
		}
		case 'patch': {
			const rest = trimmedMessage.slice('/patch'.length).trim();
			const prompt = rest
				? `Analyze the following code and provide a complete patch. Identify the bug or vulnerability, explain the root cause, and write the fixed code:\n\n${rest}`
				: `Analyze the current file and provide a complete patch for any bugs or vulnerabilities found. Explain the root cause of each issue and write fixed code.`;
			return { handled: false, userMessage: prompt };
		}
		case 'analyze': {
			const rest = trimmedMessage.slice('/analyze'.length).trim();
			const prompt = rest
				? `Perform a deep analysis of the following. Cover: logic flow, architecture, dependencies, potential issues, performance bottlenecks, and security concerns:\n\n${rest}`
				: `Perform a deep analysis of this codebase. Cover: overall architecture, logic flow, dependencies, potential issues, performance bottlenecks, and security concerns.`;
			return { handled: false, userMessage: prompt };
		}
		case 'harden': {
			const rest = trimmedMessage.slice('/harden'.length).trim();
			const prompt = rest
				? `Suggest security hardening improvements for the following code. Apply defense-in-depth principles:\n\n${rest}`
				: `Suggest security hardening improvements for this codebase. Apply defense-in-depth principles, input validation, proper authentication, and secure coding practices.`;
			return { handled: false, userMessage: prompt };
		}

		// --- Spec mode ---
		case 'spec': {
			const featureName = trimmedMessage.slice('/spec'.length).trim() || 'feature';
			const prompt = `Start spec-driven development for: "${featureName}"

Follow this workflow:
1. **Requirements** — Define what to build (user stories, acceptance criteria). Create .cortexide/specs/${featureName}/requirements.md
2. **Design** — Plan the architecture and approach. Create .cortexide/specs/${featureName}/design.md
3. **Tasks** — Break down into implementation steps. Create .cortexide/specs/${featureName}/tasks.md
4. **Implement** — Execute tasks one by one, marking each as complete.

Start with the Requirements phase. Ask clarifying questions if needed, then write requirements.md`;
			return { handled: false, userMessage: prompt };
		}
		default: {
			const skillExpansion = chatThreadsService.getSkillExpansion(trimmedMessage);
			if (skillExpansion !== null) {
				return { handled: false, userMessage: skillExpansion };
			}
			return { handled: false, userMessage: trimmedMessage };
		}
	}
};
