## ADDED Requirements

### Requirement: Main menu appears on launch
The client SHALL display a main menu screen immediately on page load, before any game is started.

#### Scenario: App loads and shows main menu
- **WHEN** the application loads in the browser
- **THEN** a main menu screen SHALL be visible with the game title and mode selection options

### Requirement: Mode selection
The main menu SHALL present two mode options: Single Player and Multiplayer.

#### Scenario: User sees mode buttons
- **WHEN** the main menu is displayed
- **THEN** two buttons or options SHALL be visible: "Single Player" and "Multiplayer"

#### Scenario: User selects Single Player
- **WHEN** the user clicks the Single Player option
- **THEN** the menu SHALL transition to the scenario selection screen

#### Scenario: User selects Multiplayer
- **WHEN** the user clicks the Multiplayer option
- **THEN** the menu SHALL transition to the multiplayer configuration screen

### Requirement: Scenario selection screen
When Single Player is selected, the menu SHALL display a list of available scenarios from `builtInScenarios` showing each scenario's name and description.

#### Scenario: Scenarios are listed
- **WHEN** the user enters the Single Player mode
- **THEN** all scenarios from `builtInScenarios` SHALL be displayed with their name and description

#### Scenario: User selects a scenario and starts
- **WHEN** the user selects a scenario and confirms
- **THEN** the game SHALL start in single player mode with that scenario loaded

### Requirement: Multiplayer configuration screen
When Multiplayer is selected, the menu SHALL provide input fields for server URL, player ID, and match ID, with sensible defaults.

#### Scenario: Multiplayer form is displayed
- **WHEN** the user enters the Multiplayer mode
- **THEN** input fields for server URL (default `ws://localhost:3001`), player ID, and match ID SHALL be visible

#### Scenario: User enters details and connects
- **WHEN** the user fills in the multiplayer form and confirms
- **THEN** the game SHALL attempt to connect to the specified server and enter multiplayer mode

### Requirement: Back navigation
The menu SHALL allow the user to navigate back from sub-screens to the mode selection screen.

#### Scenario: Back from scenario selection
- **WHEN** the user presses back from the scenario selection screen
- **THEN** the menu SHALL return to the main mode selection screen

#### Scenario: Back from multiplayer config
- **WHEN** the user presses back from the multiplayer configuration screen
- **THEN** the menu SHALL return to the main mode selection screen
