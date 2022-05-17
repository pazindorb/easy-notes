/**
 * A single easy note.
 * @typedef {Object} Note
 * @property {string} content - The text of the note.
 * @property {string} id - A unique ID to identify this note.
 * @property {object} size - The size of the text-area
 * @property {number} size.height - The height of the textarea
 * @property {number} size.width - The width of the textarea
 * @property {object} style - The aspect of the text-area
 * @property {string} style.bgColor - Color code of the text-area
 * @property {string} style.textColor - Color code of the text in the text-area
 * @property {number} style.textSize - Dimension of the text in the text-area
 * @property {number} style.textWeight - Weight of the text in the text-area
 * @property {string} userId - The user's is which owns this note.
 */

/**
 * A class which holds some constants for easy-notes
 */
class EasyNote {
	static ID = 'easy-notes';

	static FLAGS = {
		NOTES: 'notes'
	}

	static TEMPLATES = {
		EASYNOTE: `modules/${this.ID}/templates/easy-notes.hbs`
	}

	static SETTINGS = {
		INJECT_BUTTON: 'inject-button',
		TEXTAREA_HEIGHT: 'textarea-height',
		TEXTAREA_WIDTH: 'textarea-width',
		BG_COLOR: 'bg-color',
		TEXT_COLOR: 'text-color',
		TEXT_SIZE: 'text-size',
		TEXT_WEIGHT: 'text-weight'
	}

	/**
	 * A small helper function which leverages developer mode flags to gate debug logs.
	 * 
	 * @param {boolean} force - forces the log even if the debug flag is not on
	 * @param {...any} args - what to log
	 */
	static log(force, ...args) {
		const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

		if (shouldLog) {
			console.log(this.ID, '|', ...args);
		}
	}

	static initialize() {
		this.EasyNoteConfig = new EasyNoteConfig();

		// add/remove button from settings
		game.settings.register(this.ID, this.SETTINGS.INJECT_BUTTON, {
			name: `EASY-NOTES.settings.${this.SETTINGS.INJECT_BUTTON}.Name`,
			default: true,
			type: Boolean,
			scope: 'client',
			config: true,
			hint: `EASY-NOTES.settings.${this.SETTINGS.INJECT_BUTTON}.Hint`,
			onChange: () => ui.players.render()
		});

		// change text-area height from settings
		game.settings.register(this.ID, this.SETTINGS.TEXTAREA_HEIGHT, {
			name: `EASY-NOTES.settings.${this.SETTINGS.TEXTAREA_HEIGHT}.Name`,
			default: 40,
			type: Number,
			range: {
				max: 80,
				min: 20,
				step: 5
			},
			scope: 'client',
			config: true,
			hint: `EASY-NOTES.settings.${this.SETTINGS.TEXTAREA_HEIGHT}.Hint`,
			onChange: () => {
				applySettings();
				refreshEasyNotesWindow();
			}
		});

		// change text-area width from settings
		game.settings.register(this.ID, this.SETTINGS.TEXTAREA_WIDTH, {
			name: `EASY-NOTES.settings.${this.SETTINGS.TEXTAREA_WIDTH}.Name`,
			default: 80,
			type: Number,
			range: {
				max: 160,
				min: 40,
				step: 10
			},
			scope: 'client',
			config: true,
			hint: `EASY-NOTES.settings.${this.SETTINGS.TEXTAREA_WIDTH}.Hint`,
			onChange: () => window.location.reload()
		});

		// change text size in text-area
		game.settings.register(this.ID, this.SETTINGS.TEXT_SIZE, {
			name: `EASY-NOTES.settings.${this.SETTINGS.TEXT_SIZE}.Name`,
			default: 100,
			type: Number,
			range: {
				max: 200,
				min: 100,
				step: 5
			},
			scope: 'client',
			config: true,
			hint: `EASY-NOTES.settings.${this.SETTINGS.TEXT_SIZE}.Hint`,
			onChange: () => {
				applySettings();
				refreshEasyNotesWindow();
			}
		});

		// change text weight in text-area
		game.settings.register(this.ID, this.SETTINGS.TEXT_WEIGHT, {
			name: `EASY-NOTES.settings.${this.SETTINGS.TEXT_WEIGHT}.Name`,
			default: 400,
			type: Number,
			range: {
				max: 900,
				min: 100,
				step: 100
			},
			scope: 'client',
			config: true,
			hint: `EASY-NOTES.settings.${this.SETTINGS.TEXT_WEIGHT}.Hint`,
			onChange: () => {
				applySettings();
				refreshEasyNotesWindow();
			}
		});

		// change text-area background color, uses lib - Color Settings
		new window.Ardittristan.ColorSetting(this.ID, this.SETTINGS.BG_COLOR, {
			name: `EASY-NOTES.settings.${this.SETTINGS.BG_COLOR}.Name`,
			label: 'Color Picker',
			restricted: false,
			defaultColor: "#00000000",
			scope: 'client',
			hint: `EASY-NOTES.settings.${this.SETTINGS.BG_COLOR}.Hint`,
			onChange: () => {
				applySettings();
				refreshEasyNotesWindow();
			},
			insertAfter: `${this.ID}.${this.SETTINGS.TEXT_SIZE}`
		});

		// change text color in text-area, uses lib - Color Settings
		new window.Ardittristan.ColorSetting(this.ID, this.SETTINGS.TEXT_COLOR, {
			name: `EASY-NOTES.settings.${this.SETTINGS.TEXT_COLOR}.Name`,
			label: 'Color Picker',
			restricted: false,
			defaultColor: "#000000ff",
			scope: 'client',
			hint: `EASY-NOTES.settings.${this.SETTINGS.TEXT_COLOR}.Hint`,
			onChange: () => {
				applySettings();
				refreshEasyNotesWindow();
			},
			insertAfter: `${this.ID}.${this.SETTINGS.BG_COLOR}`
		});
	}
}


/**
 * Register module's debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
	registerPackageDebugFlag(EasyNote.ID)
});


/**
 * Once the game has initialized, set up our module
 */
Hooks.once('init', () => {
	EasyNote.initialize();
});

/**
 * Once game is ready check if lib - Color Settings is installed
 */
Hooks.once('ready', () => {
    try{window.Ardittristan.ColorSetting.tester} catch {
        ui.notifications.notify('Easy Notes Module | Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
    }
});

Hooks.on('renderPlayerList', (playerList, html) => {
	// do not render if un-toggled from settings
	if (!game.settings.get(EasyNote.ID, EasyNote.SETTINGS.INJECT_BUTTON)) {
		return;
	}

	// changes to size and style
	applySettings();

	// find the element which has our logged in user's id
	const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`)

	// create localized tooltip
	const tooltip = game.i18n.localize('EASY-NOTES.button-title');

	// insert a button at the end of this element
	loggedInUserListItem.append(
		`<button type='button' class='easy-notes-icon-button flex0' title='${tooltip}'><i class='fas fa-tasks'></i></button>`
	);

	// create note if the user doesn't have one
	const userData = game.users.get(game.userId).data
	if (userData.flags['easy-notes'] === undefined) {
		EasyNoteData.createEasyNote(game.userId, '')
	}

	// register an event listener for this button
	html.on('click', '.easy-notes-icon-button', (event) => {
		const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId;

		EasyNote.EasyNoteConfig.render(true, {userId});
	});
})

/**
 * Apply setting changes to size and style properties 
 */
function applySettings() {
	for (let note in EasyNoteData.getEasyNotesForUser(game.userId)) {
		EasyNoteData.updateEasyNote(note, {
			size: {
				height: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXTAREA_HEIGHT),
				width: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXTAREA_WIDTH)
			},
			style: {
				bgColor: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.BG_COLOR),
				textColor: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_COLOR),
				textSize: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_SIZE),
				textWeight: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_WEIGHT)
			}
		});
	}
}

/**
 * Refresh the window of Easy Notes
 */
function refreshEasyNotesWindow() {
	// close EasyNote window
	for (let w in ui.windows) {
		if (ui.windows[w].options.id === 'easy-notes') {
			ui.windows[w].close();
		} 
	}

	// open a new EasyNote window after a small delay
	setTimeout( () => {
		let userId = game.userId
	    EasyNote.EasyNoteConfig.render(true, {userId});
	}, 500);	
}

/**
 * The data layer for easy-notes module
 */
class EasyNoteData {
	/**
	 * Get all notes for all users indexed by by the easy note's id 
	 */
	static get allEasyNotes() {
		const allEasyNotes = game.users.reduce((accumulator, user) => {
			const userNotes = this.getEasyNotesForUser(user.id);

			return {
				...accumulator,
				...userNotes
			}
		}, {});

		return allEasyNotes;
	}

	/**
	 * Gets all of a given user's notes
	 * 
	 * @param {string} userId - id of the user whose notes to return
	 * @returns [Record<string, EasyNote> | undefined]
	 */
	static getEasyNotesForUser(userId) {
		return game.users.get(userId)?.getFlag(EasyNote.ID, EasyNote.FLAGS.NOTES);
	}

	/**
	 * Create a new note for a given user
	 * 
	 * @param {string} userId - id of the user to add this note to
	 * @param {Partial<EasyNote>} noteData - the EasyNote data to use
	 */
	static createEasyNote(userId, noteData) {
		// generate a random id for this note and populate the userId
		const newNote = {
			...noteData,
			id: foundry.utils.randomID(16),
			userId,
			size: {
				height: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXTAREA_HEIGHT),
				width: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXTAREA_WIDTH),
			},
			style: {
				bgColor: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.BG_COLOR),
				textColor: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_COLOR),
				textSize: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_SIZE),
				textWeight: game.settings.get(EasyNote.ID, EasyNote.SETTINGS.TEXT_WEIGHT)
			}
			
		}

		// construct the update to insert the new Note
		const newEasyNote = {
			[newNote.id]: newNote
		}

		// update the database with the new Note
		return game.users.get(userId)?.setFlag(EasyNote.ID, EasyNote.FLAGS.NOTES, newEasyNote);
	}

	/**
	 * Updates a given note with the provided data
	 * 
	 * @param {string} noteId - id of the note to update
	 * @param {Partial<EasyNote>} updateData - changes to be persistent
	 */
	static updateEasyNote(noteId, updateData) {
		const relevantNote = this.allEasyNotes[noteId];

		// construct the update to send
		const update = {
			[noteId]: updateData
		}

		// update the database with the updated notes
		return game.users.get(relevantNote.userId)?.setFlag(EasyNote.ID, EasyNote.FLAGS.NOTES, update);
	}

	/**
	 * Deletes a given note (not used right now, ready for future implementations)
	 * 
	 * @param {string} noteId - id of the note to delete
	 */
	static deleteEasyNote(noteId) {
		const relevantNote = this.allEasyNotes[noteId];

		// Foundry specific syntax required to delete a key from a persistent object in the database
		const keyDeletion = {
			[`-=${noteId}`]: null
		}

		// update the database with the updated notes
		return game.users.get(relevantNote.userId)?.setFlag(EasyNote.ID, EasyNote.FLAGS.NOTES, keyDeletion);
	}


	/**
	 * Updates the given user's notes with the provided updateData. This is
	 * useful for updating a single user's notes in bulk.
	 *
	 * @param {string} userId - user whose notes we are updating
	 * @param {object} updateData - data passed to setFlag
	 * @returns
	 */
	static updateUserEasyNotes(userId, updateData) {
		return game.users.get(userId)?.setFlag(EasyNote.ID, EasyNote.FLAGS.NOTES, updateData)
	}
}

/**
 * The custom FormApplication subclass which displays and edits EasyNotes
 */
class EasyNoteConfig extends FormApplication {
	static get defaultOptions() {
		const defaults = super.defaultOptions;

		const overrides = {
			height: 'auto',
			id: 'easy-notes',
			template: EasyNote.TEMPLATES.EASYNOTE,
			title: 'Easy Notes',
			userId: game.userId,
			closeOnSubmit: false, // do not close when submitted
			submitOnChange: true, // submit when any input changes
			submitOnClose: true, // submit when closed
		};

		const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

		return mergedOptions;
	}

	/**
	 * @override
	 */
	getData(options) {
		return {
			easynotes: EasyNoteData.getEasyNotesForUser(options.userId)
		}
	}

	/**
	 * @override
	 */
	async _updateObject(event, formData) {
		const expandedData = foundry.utils.expandObject(formData);

		await EasyNoteData.updateUserEasyNotes(this.options.userId, expandedData);

		this.render();
	}
}