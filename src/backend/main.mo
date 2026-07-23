import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserApproval "mo:caffeineai-user-approval/approval";
import Storage "mo:caffeineai-object-storage/Storage";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Debug "mo:core/Debug";
import AdminClaimLib "lib/admin-claim";
import AdminClaimApi "mixins/admin-claim-api";
import FriendsLib "lib/friends";
import FriendsApi "mixins/friends-api";
import FriendsTypes "types/friends";
import ChatLib "lib/chat";
import ChatApi "mixins/chat-api";
import ChatTypes "types/chat";
import AdminTrackingLib "lib/admin-tracking";
import AdminTrackingApi "mixins/admin-tracking-api";
import AdminTrackingTypes "types/admin-tracking";
import ModuleBanLib "lib/module-ban";
import ModuleBanApi "mixins/module-ban-api";
import ModuleBanTypes "types/module-ban";
import AdminRewardsLib "lib/admin-rewards";
import AdminRewardsApi "mixins/admin-rewards-api";
import AdminRewardsTypes "types/admin-rewards";
import Common "types/common";





actor {
  include MixinObjectStorage();

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  let adminClaimState = AdminClaimLib.newState();

  // --- Stable state declarations ---
  // Declared up here (before the transient callbacks and domain mixins) so
  // the callbacks and `include` blocks can reference them. Motoko allows
  // forward references to type declarations, but `let` bindings must be
  // defined before use.
  let userProfiles = Map.empty<Principal, UserProfile>();
  let adminUserStatuses = Map.empty<Principal, AdminUserStatus>();
  let adminFeatureRestrictions = Map.empty<Principal, [AdminFeatureRestriction]>();

  let gameProgress = Map.empty<Principal, [GameProgress]>();
  let eclipseAIBehavior = Map.empty<Text, EclipseAIBehavior>();
  let events = Map.empty<Text, Event>();
  let onlineUsers = Map.empty<Principal, OnlineUser>();
  let videoProjects = Map.empty<Text, VideoProject>();
  let cardDesigns = Map.empty<Text, CardDesign>();
  let jokes = Map.empty<Text, Joke>();
  let feedback = Map.empty<Text, Feedback>();
  let rewards = Map.empty<Principal, Reward>();
  let badges = Map.empty<Text, Badge>();
  let badgeProofs = Map.empty<Principal, [BadgeProof]>();
  let parentalControls = Map.empty<Principal, ParentalControl>();
  let games = Map.empty<Text, Game>();
  let hubCategories = Map.empty<Text, HubCategory>();
  let seasonalEvents = Map.empty<Text, SeasonalEvent>();
  let mascotInteractions = Map.empty<Principal, [MascotInteraction]>();
  let storyProjects = Map.empty<Text, StoryProject>();
  let craftProjects = Map.empty<Text, CraftProject>();
  let artGallery = Map.empty<Text, ArtGallerySubmission>();
  let spinRewards = Map.empty<Principal, [SpinReward]>();
  let lastSpinTime = Map.empty<Principal, Int>();
  let stickers = Map.empty<Text, Sticker>();
  let musicRemixes = Map.empty<Text, MusicRemix>();
  let musicRemixStudios = Map.empty<Text, MusicRemixStudio>();
  let certificates = Map.empty<Text, Certificate>();
  let interactiveShorts = Map.empty<Text, InteractiveShort>();
  let greenScreenFun = Map.empty<Text, GreenScreenFun>();
  let karaokeMode = Map.empty<Text, KaraokeMode>();
  let danceRoutines = Map.empty<Text, DanceRoutine>();
  let creativeFunHub = Map.empty<Principal, CreativeFunHub>();
  let learnHub = Map.empty<Principal, LearnHub>();
  let virtualPetHubMap = Map.empty<Principal, VirtualPetHub>();
  let smartHub = Map.empty<Principal, SmartHubData>();
  let inventionStories = Map.empty<Text, InventionStory>();
  let ticTacToes = Map.empty<Text, TicTacToe>();
  let jokeFavorites = Map.empty<Principal, [Text]>();
  let jokeRatings = Map.empty<Principal, Map.Map<Text, Nat>>();
  let eventNotificationsDismissed = Map.empty<Principal, Set.Set<Text>>();
  let scaryHubGames = Map.empty<Text, ScaryHubGameEntry>();
  let videoChannels = Map.empty<Text, VideoChannel>();
  let userFavoriteChannels = Map.empty<Principal, Set.Set<Text>>();

  let activityLog = List.empty<ActivityEvent>();
  var nextActivityId : Nat = 0;

  // --- New domain state (friends, chat, module-ban, admin-tracking) ---
  // Friends: pending requests keyed by recipient; accepted friendships keyed
  // by user (symmetric — both parties store each other).
  let friendRequests = Map.empty<Principal, [FriendsTypes.FriendRequest]>();
  let friendships = Map.empty<Principal, Set.Set<Principal>>();
  // Chat: messages keyed by threadId (stable ordering of the two participants).
  // The nextMessageId counter lives inside the chat state record so the chat
  // mixin can mutate it by reference (var fields passed by value do not
  // propagate back to the actor).
  let chatMessages = Map.empty<Text, [ChatTypes.Message]>();
  let chatState : ChatTypes.State = {
    messages = chatMessages;
    var nextMessageId = 0;
  };
  // Module-ban: a single set of banned module ids.
  let bannedModules = Set.empty<Text>();
  // Admin-tracking: per-user activity and a global recent-activity feed.
  let userActivity = Map.empty<Principal, [Common.ActivityEvent]>();
  let recentActivity = List.empty<Common.ActivityEvent>();

  // MixinAuthorization is required by the platform build check
  // (include-authorization). It provides the AccessControl-based isCallerAdmin.
  include MixinAuthorization(accessControlState);
  // AdminClaimApi provides the one-time admin-claim flow (claimAdmin,
  // getAdminPrincipal, isClaimedAdmin). isClaimedAdmin is intentionally named
  // distinctly from MixinAuthorization's isCallerAdmin so both mixins can be
  // composed without a duplicate-public-function conflict.
  include AdminClaimApi(adminClaimState);

  // --- Callback hooks shared with the new mixins ---
  // These closures let the mixins reach into shared state (userProfiles,
  // onlineUsers, adminUserStatuses, rewards, friendships, bannedModules)
  // without owning that state. They are defined as transient lets so they are
  // rebuilt on each (re)start rather than persisted.
  transient let userExists = func(p : Principal) : Bool {
    userProfiles.containsKey(p);
  };
  transient let nameOf = func(p : Principal) : ?Text {
    switch (userProfiles.get(p)) {
      case (?profile) { ?profile.name };
      case null { null };
    };
  };
  // 4-minute offline timeout (4 * 60 * 1_000_000_000 nanoseconds). A user is
  // considered online only while their last heartbeat is within this window.
  let PRESENCE_TIMEOUT : Int = 4 * 60 * 1_000_000_000;
  transient let isOnline = func(p : Principal) : Bool {
    switch (onlineUsers.get(p)) {
      case (?u) { (Time.now() - u.lastSeen) < PRESENCE_TIMEOUT };
      case null { false };
    };
  };
  transient let areFriends = func(a : Principal, b : Principal) : Bool {
    FriendsLib.areFriends({ friendRequests; friendships }, a, b);
  };
  transient let isBannedUser = func(p : Principal) : Bool {
    switch (adminUserStatuses.get(p)) {
      case (?#banned) { true };
      case _ { false };
    };
  };
  transient let isAdmin = func(p : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, p);
  };
  transient let allProfiles = func() : [(Principal, { name : Text; avatarConfig : ?AvatarConfig })] {
    userProfiles.entries().map<(Principal, UserProfile), (Principal, { name : Text; avatarConfig : ?AvatarConfig })>(
      func(p : Principal, profile : UserProfile) : (Principal, { name : Text; avatarConfig : ?AvatarConfig }) {
        (p, { name = profile.name; avatarConfig = profile.avatarConfig });
      },
    ).toArray();
  };
  transient let statusOf = func(p : Principal) : Text {
    switch (adminUserStatuses.get(p)) {
      case (?#active) { "active" };
      case (?#restricted) { "restricted" };
      case (?#suspended) { "suspended" };
      case (?#banned) { "banned" };
      case null { "active" };
    };
  };
  transient let lastSeenOf = func(p : Principal) : Int {
    switch (onlineUsers.get(p)) {
      case (?u) { u.lastSeen };
      case null { 0 };
    };
  };
  // Build the public online-users view: only users whose OnlineUser record
  // reports isOnline = true. Returns AdminUserView records (principal, name,
  // status, lastSeen, avatarConfig) so the frontend friends panel can render
  // online users for any authenticated non-admin caller. Reuses the same
  // statusOf / lastSeenOf / allProfiles callbacks the admin-tracking view
  // uses, filtered to the online subset.
  transient let onlineUsersView = func() : [Common.AdminUserView] {
    let now = Time.now();
    let profiles = allProfiles();
    profiles.filter<(Principal, { name : Text; avatarConfig : ?AvatarConfig })>(
      func(p : Principal, _profile : { name : Text; avatarConfig : ?AvatarConfig }) : Bool {
        switch (onlineUsers.get(p)) {
          case (?u) { (now - u.lastSeen) < PRESENCE_TIMEOUT };
          case null { false };
        };
      },
    ).map<(Principal, { name : Text; avatarConfig : ?AvatarConfig }), Common.AdminUserView>(
      func(p : Principal, profile : { name : Text; avatarConfig : ?AvatarConfig }) : Common.AdminUserView = {
        principal = p;
        name = profile.name;
        status = statusOf(p);
        lastSeen = lastSeenOf(p);
        avatarConfig = profile.avatarConfig;
      },
    );
  };
  transient let allModuleIds = func() : [Text] {
    [
      "dashboard",
      "games",
      "video-hub",
      "virtual-pet",
      "spin-wheel",
      "chat",
      "friends",
      "creative-fun",
      "learn-hub",
      "smart-hub",
      "story-studio",
      "art-gallery",
      "music-remix",
      "video-studio",
      "karaoke",
      "dance",
      "green-screen",
      "interactive-shorts",
      "stickers",
      "certificates",
      "events",
      "jokes",
      "feedback",
      "cards",
      "tic-tac-toe",
      "scary-hub",
    ];
  };
  transient let addPoints = func(p : Principal, points : Nat) : () {
    let current = switch (rewards.get(p)) {
      case (?r) { r };
      case null {
        {
          userId = p;
          points = 0;
          badges = [];
          achievements = [];
          virtualPetLevel = 0;
          totalTrophies = 0;
        };
      };
    };
    let updated : Reward = { current with points = current.points + points };
    rewards.add(p, updated);
  };

  // --- New domain mixins ---
  include FriendsApi(
    { friendRequests; friendships },
    userExists,
    nameOf,
    isOnline,
    onlineUsersView,
  );
  include ChatApi(
    chatState,
    areFriends,
    isBannedUser,
    nameOf,
  );
  include AdminTrackingApi(
    { userActivity; recentActivity },
    isAdmin,
    allProfiles,
    statusOf,
    lastSeenOf,
  );
  include ModuleBanApi(
    { bannedModules },
    isAdmin,
    allModuleIds,
  );
  include AdminRewardsApi(
    isAdmin,
    userExists,
    addPoints,
  );

  let SPIN_COOLDOWN = 1200000000000; // 20 minutes in nanoseconds
  let DEFAULT_TROPHIES : Nat = 70;
  let TROPHIES_PER_GAME : Nat = 2;
  let WELCOME_BACK_BONUS : Nat = 40;

  public type UserProfile = {
    name : Text;
    age : Nat;
    parentPrincipal : Principal;
    approvedContacts : [Principal];
    screenTimeLimit : Nat;
    contentFilterLevel : Text;
    avatarUrl : Text;
    theme : Text;
    mascotPreference : Text;
    accessibilitySettings : AccessibilitySettings;
    avatarConfig : ?AvatarConfig;
  };
  public type AccessibilitySettings = {
    readAloudEnabled : Bool;
    highContrastMode : Bool;
    largeText : Bool;
  };
  public type AvatarConfig = {
    body : Text;
    head : Text;
    hair : Text;
    pants : Text;
    headwear : Text;
    shoes : Text;
  };
  public type GameProgress = {
    gameId : Text;
    highScore : Nat;
    level : Nat;
    achievements : [Text];
    completionStats : Text;
    lastPlayed : Int;
    difficulty : Text;
  };
  public type EclipseAIBehavior = {
    userId : Principal;
    gameId : Text;
    sessionId : Text;
    playerActions : [PlayerAction];
    aiResponses : [AIResponse];
    difficultyLevel : Nat;
    performanceMetrics : PerformanceMetrics;
    dialogueEvolution : [DialogueState];
    timestamp : Int;
  };
  public type PlayerAction = {
    actionType : Text;
    timestamp : Int;
    success : Bool;
    resourcesCollected : Nat;
    enemiesDefeated : Nat;
  };
  public type AIResponse = {
    responseType : Text;
    hintProvided : ?Text;
    difficultyAdjustment : Int;
    timestamp : Int;
  };
  public type PerformanceMetrics = {
    survivalTime : Nat;
    resourceEfficiency : Nat;
    combatSuccess : Nat;
    explorationScore : Nat;
  };
  public type DialogueState = {
    tone : Text;
    pacing : Text;
    adaptationLevel : Nat;
    timestamp : Int;
  };
  public type Event = {
    id : Text;
    owner : Principal;
    eventType : Text;
    title : Text;
    date : Int;
    description : Text;
    rsvps : [Principal];
    photos : [Text];
    checklist : [Text];
    isSeasonal : Bool;
    seasonalType : ?Text;
  };
  public type ChatMessage = {
    id : Text;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
    isGroupChat : Bool;
    groupId : ?Text;
  };
  public type OnlineUser = {
    userId : Principal;
    lastSeen : Int;
    isOnline : Bool;
  };
  public type CardDesign = {
    id : Text;
    owner : Principal;
    template : Text;
    content : Text;
    createdAt : Int;
  };
  public type Joke = {
    id : Text;
    category : Text;
    content : Text;
    submittedBy : ?Principal;
    approved : Bool;
    rating : Nat;
  };
  public type Feedback = {
    id : Text;
    submitter : Principal;
    feedbackType : Text;
    content : Text;
    timestamp : Int;
    response : ?Text;
    anonymous : Bool;
  };
  public type Reward = {
    userId : Principal;
    points : Nat;
    badges : [Text];
    achievements : [Text];
    virtualPetLevel : Nat;
    totalTrophies : Nat;
  };
  public type ParentalControl = {
    childPrincipal : Principal;
    parentPrincipal : Principal;
    screenTimeLimit : Nat;
    contentFilter : Text;
    approvedContacts : [Principal];
    chatMonitoring : Bool;
  };
  public type Game = {
    id : Text;
    title : Text;
    description : Text;
    category : Text;
    difficulty : Text;
    instructions : Text;
    assets : [Text];
    highScore : Nat;
    lastPlayed : Int;
    isFavorite : Bool;
  };
  public type HubCategory = {
    id : Text;
    name : Text;
    description : Text;
    games : [Text];
  };
  public type SeasonalEvent = {
    id : Text;
    name : Text;
    startDate : Int;
    endDate : Int;
    theme : Text;
    activities : [Text];
    isActive : Bool;
  };
  public type MascotInteraction = {
    userId : Principal;
    interactionType : Text;
    timestamp : Int;
    message : Text;
  };
  public type StoryProject = {
    id : Text;
    owner : Principal;
    title : Text;
    scenes : [Scene];
    createdAt : Int;
    published : Bool;
    approved : Bool;
  };
  public type Scene = {
    background : Text;
    characters : [Character];
    props : [Prop];
    animations : [Text];
    textBubbles : [TextBubble];
  };
  public type Character = {
    name : Text;
    position : { x : Nat; y : Nat };
    avatarConfig : AvatarConfig;
  };
  public type Prop = {
    name : Text;
    position : { x : Nat; y : Nat };
    type_ : Text;
  };
  public type TextBubble = {
    content : Text;
    position : { x : Nat; y : Nat };
    character : Text;
    style : Text;
  };
  public type CraftProject = {
    id : Text;
    category : Text;
    title : Text;
    difficulty : Text;
    steps : [Text];
    materials : [Text];
    safetyTips : [Text];
    completedBy : [Principal];
    badges : [Text];
  };
  public type ArtGallerySubmission = {
    id : Text;
    owner : Principal;
    title : Text;
    artworkUrl : Text;
    category : Text;
    createdAt : Int;
    isPublic : Bool;
    approved : Bool;
  };
  public type SpinReward = {
    rewardType : Text;
    value : Text;
    timestamp : Int;
  };
  public type Sticker = {
    id : Text;
    creator : Principal;
    name : Text;
    image : Storage.ExternalBlob;
    isModerated : Bool;
    approved : Bool;
  };
  public type VideoProject = {
    id : Text;
    owner : Principal;
    title : Text;
    duration : Nat;
    createdAt : Int;
    exportUrl : ?Text;
    characters : [Text];
    scenes : [Text];
    animations : [Text];
    isPublic : Bool;
    approved : Bool;
  };
  public type MusicRemix = {
    id : Text;
    creator : Principal;
    title : Text;
    audio : Storage.ExternalBlob;
    duration : Nat;
    isPublic : Bool;
    approved : Bool;
  };
  public type MusicRemixStudio = {
    id : Text;
    creator : Principal;
    title : Text;
    tempo : Nat;
    pitch : Int;
    volume : Nat;
    reverb : Nat;
    delay : Nat;
  };
  public type Certificate = {
    id : Text;
    userId : Principal;
    achievement : Text;
    date : Int;
    pdfUrl : Storage.ExternalBlob;
    award : Text;
    mascot : Text;
    backgroundColor : Text;
    theme : Text;
  };
  public type InteractiveShort = {
    id : Text;
    title : Text;
    description : Text;
    owner : Principal;
    scenes : [ShortScene];
    choices : [[ShortChoice]];
    endingSummary : Text;
    isPublic : Bool;
    approved : Bool;
  };
  public type ShortScene = {
    id : Text;
    description : Text;
    visualAssets : [Text];
    soundEffects : [Text];
    transitions : [Text];
    backgroundMusic : ?Text;
    visualStyles : VisualStyle;
  };
  public type ShortChoice = {
    id : Text;
    description : Text;
    leadsToScene : Text;
  };
  public type VisualStyle = {
    colorPalette : [Text];
    animationType : Text;
    transitionEffects : [Text];
    sceneryType : Text;
  };
  public type GreenScreenFun = {
    id : Text;
    owner : Principal;
    sceneTitle : Text;
    sceneDescription : Text;
    background : Text;
    overlays : [Text];
    privacyFilterEnabled : Bool;
    contentWarnings : ?Text;
    adjustedPreview : Text;
    originalImage : Text;
    positionings : [(Text, (Nat, Nat))];
    isPublic : Bool;
    approved : Bool;
  };
  public type KaraokeMode = {
    songId : Text;
    owner : Principal;
    title : Text;
    lyrics : Text;
    audioBlob : Storage.ExternalBlob;
    vocalVolume : Nat;
    backgroundMusicVolume : Nat;
    visualizationsEnabled : Bool;
    animationAssets : [Text];
    visualStyles : VisualStyle;
    recordingUrl : ?Text;
    isPublic : Bool;
  };
  public type DanceRoutine = {
    id : Text;
    owner : Principal;
    title : Text;
    musicTrack : Storage.ExternalBlob;
    difficulty : Text;
    poseGuideAssets : [Text];
    cameraRequired : Bool;
    visualStyles : VisualStyle;
    encouragementMessages : [Text];
    completedBy : [Principal];
  };
  public type CreativeFunHub = {
    userId : Principal;
    shortsWatched : Nat;
    greenScreenCreations : Nat;
    karaokePerformances : Nat;
    danceChallengesCompleted : Nat;
    preferences : CreativeFunPreferences;
    lastAccessed : Int;
  };
  public type CreativeFunPreferences = {
    preferredVisualStyle : Text;
    mascotVoiceEnabled : Bool;
    language : Text;
    accessibilityMode : Bool;
  };
  public type LearnHub = {
    userId : Principal;
    readingProgress : ReadingProgress;
    scienceProgress : ScienceProgress;
    artsMusicProgress : ArtsMusicProgress;
    discoveryZoneProgress : DiscoveryZoneProgress;
    preferences : LearnHubPreferences;
    lastAccessed : Int;
  };
  public type LearnHubPreferences = {
    preferredCategory : Text;
    mascotVoiceEnabled : Bool;
    language : Text;
    accessibilityMode : Bool;
  };
  public type Lesson = {
    id : Text;
    title : Text;
    content : Text;
    category : Text;
    difficulty : Text;
    isCompleted : Bool;
    score : ?Nat;
    attempts : Nat;
    starsEarned : [Text];
  };
  public type ReadingProgress = {
    progressLevel : Text;
    lessonsCompleted : [Lesson];
    starsEarned : [Text];
  };
  public type ScienceProgress = {
    focusArea : Text;
    lessonsCompleted : [Lesson];
    badgesEarned : [Text];
  };
  public type ArtsMusicProgress = {
    progressArea : Text;
    lessonsCompleted : [Lesson];
    artisticAchievements : [Text];
  };
  public type DiscoveryZoneProgress = {
    curiosityScore : Nat;
    lessonsCompleted : [Lesson];
    discoveryAchievements : [Text];
    inventionStoriesRead : [Text];
    currentInventionStoryId : ?Text;
    lastStoryStartedAt : ?Time.Time;
  };
  public type VirtualPetHub = {
    userId : Principal;
    petName : Text;
    happinessLevel : Nat;
    growthStage : Nat;
    accessories : [Text];
    decorations : [Text];
    homeStyle : Text;
    warnedAboutExtremeChanges : Bool;
    trophies : Nat;
  };
  public type RecentlyPlayedItem = {
    activityId : Text;
    title : Text;
    activityType : Text;
    timestamp : Time.Time;
    difficulty : Text;
  };
  public type SmartHubData = {
    userId : Principal;
    recommendedActivities : [Text];
    recentlyPlayed : [RecentlyPlayedItem];
    dailyPick : Text;
    createdAt : Time.Time;
    lastUpdated : Time.Time;
    difficultySetting : Text;
    dailyPickChangedAt : Time.Time;
    dailyPickPrevious : ?Text;
  };
  public type InventionStory = {
    id : Text;
    title : Text;
    content : Text;
    author : Text;
    visualAssets : [Text];
    narrationAudio : ?Storage.ExternalBlob;
    recommendedAge : Nat;
    discoveryLevel : Text;
    category : Text;
    visualStyle : VisualStyle;
    narrationStyle : Text;
    backgroundMusic : ?Text;
    interactiveElements : [Text];
    achievementBadge : Text;
    certificateId : ?Text;
    funFacts : [Text];
    mascotCommentary : [Text];
  };
  public type AdminUserStatus = {
    #active;
    #restricted;
    #suspended;
    #banned;
  };
  public type AdminStatusRecord = {
    userId : Principal;
    status : AdminUserStatus;
    reason : ?Text;
    changedBy : Principal;
    changedAt : Time.Time;
  };
  public type AdminFeatureRestriction = {
    userId : Principal;
    feature : Text;
    restrictedBy : Principal;
    reason : ?Text;
    createdAt : Time.Time;
    updatedAt : ?Time.Time;
  };
  public type AdminDashboardOverview = {
    activeUsers : [Principal];
    userStats : { total : Nat; active : Nat; restricted : Nat; suspended : Nat; banned : Nat };
    activitySummary : { recentActivities : Nat; systemEvents : Nat };
  };
  public type AdminDashboardSection = {
    overview : AdminDashboardOverview;
    manageUsers : [UserProfile];
    restrictions : [AdminFeatureRestriction];
    settings : { adminPreferences : Text };
    safetyAlerts : [Text];
  };
  public type TicTacToe = {
    userId : ?Principal;
    opponentId : ?Principal;
    mode : Text;
    moves : [Move];
    outcome : TicTacToeOutcome;
  };
  public type Move = {
    player : Text;
    playerId : ?Principal;
    x : Nat;
    y : Nat;
  };
  public type TicTacToeOutcome = {
    #won : Text;
    #draw;
    #ongoing;
  };
  public type Badge = {
    name : Text;
    description : Text;
    category : Text;
    requirement : Text;
    rewardPoints : Nat;
  };
  public type BadgeProof = {
    badge : Badge;
    proof : Text;
    timestamp : Int;
  };
  public type SpinRewardUpdate = {
    spinReward : SpinReward;
    badgesEarned : [BadgeProof];
    pointsAwarded : Nat;
    extraSpin : Bool;
  };
  public type ScaryHubGameEntry = {
    id : Text;
    title : Text;
    description : Text;
    category : Text;
    isScary : Bool;
    difficulty : Text;
    theme : Text;
    instructions : Text;
    assets : [Text];
    highScore : Nat;
    lastPlayed : Int;
    isFavorite : Bool;
  };
  public type VideoChannelCategory = {
    categoryId : Text;
    name : Text;
    ageRange : Text;
    description : Text;
    channels : [VideoChannel];
  };
  public type VideoChannel = {
    channelId : Text;
    name : Text;
    description : Text;
    playlistUrl : Text;
    iconUrl : Text;
    categoryId : Text;
    safe : Bool;
    approved : Bool;
    createdAt : Time.Time;
    lastUpdated : ?Time.Time;
    lastPlayed : ?Time.Time;
    isFavorite : Bool;
    totalVideos : Nat;
    views : Nat;
  };
  public type ActivityType = {
    #user_created;
    #game_played : { gameId : Text; gameName : Text };
  };
  public type ActivityEvent = {
    id : Nat;
    userId : Principal;
    activityType : ActivityType;
    timestamp : Time.Time;
  };

  // --- New public type aliases (re-exported for the candid interface) ---
  public type FriendRequest = Common.FriendRequest;
  public type Friend = Common.Friend;
  public type FriendResult = Common.FriendResult;
  public type ChatThread = Common.ChatThread;
  public type ChatResult = Common.ChatResult;
  public type ChatMessageRecord = ChatTypes.Message;
  public type AdminUserView = Common.AdminUserView;
  public type ActivityEventRecord = Common.ActivityEvent;
  public type ModuleStatus = Common.ModuleStatus;
  public type ModuleBanResult = Common.ModuleBanResult;
  public type RewardResult = Common.RewardResult;

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Return null for unregistered callers instead of trapping. The frontend
    // avatar-save fallback path (useSaveAvatarConfig) relies on a clean null
    // return to detect "no profile yet" and trigger registration via
    // saveCallerUserProfile. Trapping here surfaced as "Failed to save avatar"
    // on the first save attempt.
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Auto-register the caller with #user permission if not already registered.
    // This lets avatar save work for unregistered users (the avatar save flow
    // is the first write many users perform).
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      AccessControl.initialize(accessControlState, caller);
    };

    let isNewProfile = switch (userProfiles.get(caller)) {
      case (null) { true };
      case (?_) { false };
    };

    userProfiles.add(caller, profile);

    if (isNewProfile) {
      let activity : ActivityEvent = {
        id = nextActivityId;
        userId = caller;
        activityType = #user_created;
        timestamp = Time.now();
      };
      activityLog.add(activity);
      nextActivityId += 1;

      // Auto-friend the admin with the newly registered user so every user
      // is friends with admin by default.
      switch (AdminClaimLib.getAdmin(adminClaimState)) {
        case (?admin) {
          FriendsLib.autoFriendAdmin({ friendRequests; friendships }, admin, caller);
        };
        case null {};
      };

      // Record the registration activity in the admin-tracking feed.
      AdminTrackingLib.record({ userActivity; recentActivity }, caller, "user_created", "");
    };
  };

  public query ({ caller }) func getTotalScore() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their total score");
    };
    switch (rewards.get(caller)) {
      case (?reward) { reward.points };
      case (null) { 0 };
    };
  };

  // Heartbeat: any authenticated user calls this periodically (e.g. every
  // minute) to mark themselves online. Writes the caller's principal into the
  // onlineUsers map with lastSeen = Time.now() and isOnline = true. The
  // isOnline / lastSeenOf / onlineUsersView callbacks all derive freshness
  // from lastSeen against the 4-minute PRESENCE_TIMEOUT window, so a user is
  // considered offline once their last heartbeat is older than that window.
  public shared ({ caller }) func updatePresence() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update presence");
    };
    let entry : OnlineUser = {
      userId = caller;
      lastSeen = Time.now();
      isOnline = true;
    };
    onlineUsers.add(caller, entry);
  };

  public type SpinWheelResult = {
    pointsAdded : Nat;
    remainingCooldown : Nat;
    message : Text;
  };

  public shared ({ caller }) func claimSpinReward(points : Nat) : async SpinWheelResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim spin rewards");
    };
    let now = Time.now();
    let lastSpin = switch (lastSpinTime.get(caller)) {
      case (?t) { t };
      case (null) { 0 };
    };
    // Enforce 20-minute cooldown
    if (now - lastSpin < SPIN_COOLDOWN) {
      let remaining = ((lastSpin + SPIN_COOLDOWN) - now) / 1_000_000_000;
      return {
        pointsAdded = 0;
        // Always convert remaining to Nat type, using Int::toNat() from mo:core module for type compatibility.
        remainingCooldown = remaining.toNat();
        message = "SPIN IS ON COOLDOWN";
      };
    };
    // Record the spin timestamp
    lastSpinTime.add(caller, now);
    // Add points EXCLUSIVELY to VirtualPetHub trophies (not to any other score/reward field)
    let currentPet = switch (virtualPetHubMap.get(caller)) {
      case (?p) { p };
      case (null) {
        {
          userId = caller;
          petName = "";
          happinessLevel = 0;
          growthStage = 0;
          accessories = [];
          decorations = [];
          homeStyle = "";
          warnedAboutExtremeChanges = false;
          trophies = 0;
        };
      };
    };
    let updatedPet : VirtualPetHub = {
      currentPet with
      trophies = currentPet.trophies + points;
    };
    virtualPetHubMap.add(caller, updatedPet);
    {
      pointsAdded = points;
      remainingCooldown = 0;
      message = "Points added to Virtual Pet";
    };
  };

  public query ({ caller }) func getRemainingSpinCooldown() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check spin cooldown");
    };
    let now = Time.now();
    switch (lastSpinTime.get(caller)) {
      case (?last) {
        if (now - last < SPIN_COOLDOWN) {
          let remaining = ((last + SPIN_COOLDOWN) - now) / 1_000_000_000;
          // Always convert remaining to Nat type, using Int::toNat() from mo:core module for type compatibility.
          remaining.toNat();
        } else {
          0;
        };
      };
      case (null) { 0 };
    };
  };

  public query ({ caller }) func getVirtualPetHub() : async ?VirtualPetHub {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their virtual pet");
    };
    virtualPetHubMap.get(caller);
  };

  public shared ({ caller }) func saveVirtualPetHub(pet : VirtualPetHub) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their virtual pet");
    };
    virtualPetHubMap.add(caller, { pet with userId = caller });
  };

  public query ({ caller }) func getCallerRewards() : async ?Reward {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their rewards");
    };
    rewards.get(caller);
  };

  public shared ({ caller }) func saveCallerRewards(reward : Reward) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their rewards");
    };
    rewards.add(caller, { reward with userId = caller });
  };

  public query ({ caller }) func getSpinRewards() : async [SpinReward] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their spin rewards");
    };
    switch (spinRewards.get(caller)) {
      case (?sr) { sr };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func recordSpinReward(reward : SpinReward) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record spin rewards");
    };
    let existing = switch (spinRewards.get(caller)) {
      case (?sr) { sr };
      case (null) { [] };
    };
    spinRewards.add(caller, existing.concat([reward]));
    // NOTE: lastSpinTime is NOT updated here; cooldown is enforced only in claimSpinReward.
  };

  public query ({ caller }) func getLastSpinTime() : async ?Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their spin time");
    };
    lastSpinTime.get(caller);
  };

  public shared ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public query func listApprovals() : async [UserApproval.UserApprovalInfo] {
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set approval status");
    };
    UserApproval.setApproval(approvalState, user, status);
  };
};
