import flask from '@tabler/icons/outline/flask.svg?raw';
import droplet from '@tabler/icons/outline/droplet.svg?raw';
import batteryCharging from '@tabler/icons/outline/battery-charging.svg?raw';
import shield from '@tabler/icons/outline/shield.svg?raw';
import heart from '@tabler/icons/outline/heart.svg?raw';
import tool from '@tabler/icons/outline/tool.svg?raw';
import bolt from '@tabler/icons/outline/bolt.svg?raw';
import lock from '@tabler/icons/outline/lock.svg?raw';
import arrowLeft from '@tabler/icons/outline/arrow-left.svg?raw';
import leaf from '@tabler/icons/outline/leaf.svg?raw';
import sun from '@tabler/icons/outline/sun.svg?raw';
import seedling from '@tabler/icons/outline/seedling.svg?raw';
import help from '@tabler/icons/outline/help.svg?raw';
import database from '@tabler/icons/outline/database.svg?raw';
import volume from '@tabler/icons/outline/volume.svg?raw';
import volumeOff from '@tabler/icons/outline/volume-off.svg?raw';
import rocket from '@tabler/icons/outline/rocket.svg?raw';
import refresh from '@tabler/icons/outline/refresh.svg?raw';
import alert from '@tabler/icons/outline/alert-triangle.svg?raw';
import arrowUp from '@tabler/icons/outline/arrow-up.svg?raw';
import arrowDown from '@tabler/icons/outline/arrow-down.svg?raw';
import infoCircle from '@tabler/icons/outline/info-circle.svg?raw';
import history from '@tabler/icons/outline/history.svg?raw';
import satellite from '@tabler/icons/outline/satellite.svg?raw';
import bulb from '@tabler/icons/outline/bulb.svg?raw';
import check from '@tabler/icons/outline/check.svg?raw';
import planet from '@tabler/icons/outline/planet.svg?raw';
import moon from '@tabler/icons/outline/moon.svg?raw';
import music from '@tabler/icons/outline/music.svg?raw';
import musicOff from '@tabler/icons/outline/music-off.svg?raw';
import moodSmile from '@tabler/icons/outline/mood-smile.svg?raw';
import moodNeutral from '@tabler/icons/outline/mood-neutral.svg?raw';
import moodSad from '@tabler/icons/outline/mood-sad.svg?raw';
import ghost from '@tabler/icons/outline/ghost.svg?raw';
import speakerphone from '@tabler/icons/outline/speakerphone.svg?raw';
import calendarPlus from '@tabler/icons/outline/calendar-plus.svg?raw';
import calendar from '@tabler/icons/outline/calendar.svg?raw';
import trophy from '@tabler/icons/outline/trophy.svg?raw';
import photo from '@tabler/icons/outline/photo.svg?raw';
import settings from '@tabler/icons/outline/settings.svg?raw';
import chevronRight from '@tabler/icons/outline/chevron-right.svg?raw';
import star from '@tabler/icons/outline/star.svg?raw';

const ICONS = {
  flask, droplet, batteryCharging, shield, heart, tool, bolt, lock, arrowLeft, leaf, sun, seedling, help,
  database, volume, volumeOff, rocket, refresh, alert, arrowUp, arrowDown, infoCircle, history, satellite, bulb, check, planet, moon,
  moodSmile, moodNeutral, moodSad, music, musicOff, ghost, star, settings, chevronRight, photo, speakerphone, calendarPlus, calendar, trophy,
} as const;

export type IconName = keyof typeof ICONS;

export function icon(name: IconName, cls = ''): string {
  return `<span class="ic ${cls}" aria-hidden="true">${ICONS[name]}</span>`;
}
