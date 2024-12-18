import {
	File,
	FileCode,
	BookMarked,
	List,
	ListChecks,
	Check,
	User,
	UserCog,
	UserPen,
	Calendar,
	CalendarClock,
	CalendarDays,
	CalendarCheck2,
	Code,
	Bug,
	Terminal,
	Binary,
	Settings,
	Settings2,
	GitBranch,
	GitCommit,
	GitMerge,
	GitPullRequest,
	GitPullRequestClosed,
	Divide,
	Omega,
	Radical,
	Infinity,
	Pi,
	Atom,
	Percent,
	CloudHail,
	CloudFog,
	ShoppingCart,
	LockKeyhole,
	DraftingCompass,
	Ruler,
	Key,
	KeyRound,
	KeySquare,
	LockOpen,
	ShoppingBag,
	Cloud,
	CloudDrizzle,
	Droplets,
	CloudSun,
	CloudSnow,
	CloudRain,
	CloudLightning,
	CloudMoon,
	Snowflake,
	Sun,
	SunDim,
	SunMedium,
	Sunrise,
	Sunset,
	Thermometer,
	ThermometerSnowflake,
	ThermometerSun,
	Umbrella,
	Wind,
	Banknote,
	ChartScatter,
	ChartLine,
	ChartBar,
	ChartArea,
	TrendingDown,
	Coins,
	Wallet,
	PiggyBank,
	Landmark,
	Bitcoin,
	CreditCard,
	DollarSign,
	Receipt,
	TrendingUp,
	ChartPie,
	Smile,
	Paintbrush,
	Pencil,
	Axe,
	Drill,
	Star,
	ThumbsDown,
	ThumbsUp,
	Heart,
	Laugh,
	Meh,
	Frown,
	Wrench,
	Hammer,
	Scissors,
	Lock
} from 'lucide-svelte'
import type { ComponentType } from 'svelte'

export type FileIcon = {
	name: string
	icon: ComponentType
}

export const fileIcons: FileIcon[] = [
	// General file and document icons
	{ name: 'File', icon: File },
	{ name: 'FileCode', icon: FileCode },
	{ name: 'BookMarked', icon: BookMarked },

	// List and task-related icons
	{ name: 'List', icon: List },
	{ name: 'ListChecks', icon: ListChecks },
	{ name: 'Check', icon: Check },

	// User-related icons
	{ name: 'User', icon: User },
	{ name: 'UserCog', icon: UserCog },
	{ name: 'UserPen', icon: UserPen },

	// Calendar and time-related icons
	{ name: 'Calendar', icon: Calendar },
	{ name: 'CalendarClock', icon: CalendarClock },
	{ name: 'CalendarDays', icon: CalendarDays },
	{ name: 'CalendarCheck2', icon: CalendarCheck2 },

	// Development and coding icons
	{ name: 'Code', icon: Code },
	{ name: 'Bug', icon: Bug },
	{ name: 'Terminal', icon: Terminal },
	{ name: 'Binary', icon: Binary },

	// Settings and configuration icons
	{ name: 'Settings', icon: Settings },
	{ name: 'Settings2', icon: Settings2 },

	// Version control icons
	{ name: 'GitBranch', icon: GitBranch },
	{ name: 'GitCommit', icon: GitCommit },
	{ name: 'GitMerge', icon: GitMerge },
	{ name: 'GitPullRequest', icon: GitPullRequest },
	{ name: 'GitPullRequestClosed', icon: GitPullRequestClosed },

	// Mathematical and scientific icons
	{ name: 'Divide', icon: Divide },
	{ name: 'Omega', icon: Omega },
	{ name: 'Radical', icon: Radical },
	{ name: 'Infinity', icon: Infinity },
	{ name: 'Pi', icon: Pi },
	{ name: 'Atom', icon: Atom },
	{ name: 'Percent', icon: Percent },

	// Measurement and tools icons
	{ name: 'DraftingCompass', icon: DraftingCompass },
	{ name: 'Ruler', icon: Ruler },

	// Security and access icons
	{ name: 'Key', icon: Key },
	{ name: 'KeyRound', icon: KeyRound },
	{ name: 'KeySquare', icon: KeySquare },
	{ name: 'Lock', icon: Lock },
	{ name: 'LockOpen', icon: LockOpen },
	{ name: 'LockKeyhole', icon: LockKeyhole },

	// Shopping icons
	{ name: 'ShoppingBag', icon: ShoppingBag },
	{ name: 'ShoppingCart', icon: ShoppingCart },

	// Weather icons
	{ name: 'Cloud', icon: Cloud },
	{ name: 'CloudDrizzle', icon: CloudDrizzle },
	{ name: 'CloudFog', icon: CloudFog },
	{ name: 'CloudHail', icon: CloudHail },
	{ name: 'CloudLightning', icon: CloudLightning },
	{ name: 'CloudMoon', icon: CloudMoon },
	{ name: 'CloudRain', icon: CloudRain },
	{ name: 'CloudSnow', icon: CloudSnow },
	{ name: 'CloudSun', icon: CloudSun },
	{ name: 'Droplets', icon: Droplets },
	{ name: 'Snowflake', icon: Snowflake },
	{ name: 'Sun', icon: Sun },
	{ name: 'SunDim', icon: SunDim },
	{ name: 'SunMedium', icon: SunMedium },
	{ name: 'Sunrise', icon: Sunrise },
	{ name: 'Sunset', icon: Sunset },
	{ name: 'Thermometer', icon: Thermometer },
	{ name: 'ThermometerSnowflake', icon: ThermometerSnowflake },
	{ name: 'ThermometerSun', icon: ThermometerSun },
	{ name: 'Umbrella', icon: Umbrella },
	{ name: 'Wind', icon: Wind },

	// Finance and currency icons
	{ name: 'Banknote', icon: Banknote },
	{ name: 'Bitcoin', icon: Bitcoin },
	{ name: 'CreditCard', icon: CreditCard },
	{ name: 'DollarSign', icon: DollarSign },
	{ name: 'Landmark', icon: Landmark },
	{ name: 'PiggyBank', icon: PiggyBank },
	{ name: 'Wallet', icon: Wallet },
	{ name: 'Coins', icon: Coins },
	{ name: 'Receipt', icon: Receipt },

	// Chart and trend icons
	{ name: 'TrendingUp', icon: TrendingUp },
	{ name: 'TrendingDown', icon: TrendingDown },
	{ name: 'ChartArea', icon: ChartArea },
	{ name: 'ChartBar', icon: ChartBar },
	{ name: 'ChartLine', icon: ChartLine },
	{ name: 'ChartPie', icon: ChartPie },
	{ name: 'ChartScatter', icon: ChartScatter },

	// Emoji and reaction icons
	{ name: 'Smile', icon: Smile },
	{ name: 'Frown', icon: Frown },
	{ name: 'Meh', icon: Meh },
	{ name: 'Laugh', icon: Laugh },
	{ name: 'Heart', icon: Heart },
	{ name: 'ThumbsUp', icon: ThumbsUp },
	{ name: 'ThumbsDown', icon: ThumbsDown },
	{ name: 'Star', icon: Star },

	// Tools and crafting icons
	{ name: 'Wrench', icon: Wrench },
	{ name: 'Hammer', icon: Hammer },
	{ name: 'Drill', icon: Drill },
	{ name: 'Scissors', icon: Scissors },
	{ name: 'Axe', icon: Axe },
	{ name: 'Pencil', icon: Pencil },
	{ name: 'Paintbrush', icon: Paintbrush }
]

export const iconColors = [
	{ name: 'White', color: '#ffffff' },
	{ name: 'Blue', color: '#007ad9' },
	{ name: 'Yellow', color: '#ff6f00' },
	{ name: 'Green', color: '#2f8659' },
	{ name: 'Purple', color: '#493ec8' },
	{ name: 'Red', color: '#cb4646' }
]
