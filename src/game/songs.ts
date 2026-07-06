export type ArtistKey = 'sean' | 'pit'

export interface Song {
  /** Track title */
  t: string
  /** Artist key */
  a: ArtistKey
  /** Meta line: year · album */
  m: string
}

/** Full name for an artist key. */
export const ARTIST_NAME: Record<ArtistKey, string> = {
  sean: 'Sean Paul',
  pit: 'Pitbull',
}

/**
 * Track pool for the blindtest — 10 Sean Paul, 10 Pitbull.
 * (No real audio yet: the player shows a placeholder clip.)
 */
export const SONGS: readonly Song[] = [
  { t: 'Temperature', a: 'sean', m: '2005 · The Trinity' },
  { t: 'Get Busy', a: 'sean', m: '2003 · Dutty Rock' },
  { t: 'Gimme the Light', a: 'sean', m: '2002 · Dutty Rock' },
  { t: "We Be Burnin'", a: 'sean', m: '2005 · The Trinity' },
  { t: 'Like Glue', a: 'sean', m: '2003 · Dutty Rock' },
  { t: 'Give It Up to Me', a: 'sean', m: '2006 · The Trinity' },
  { t: "She Doesn't Mind", a: 'sean', m: '2011 · Tomahawk Technique' },
  { t: 'Got 2 Luv U', a: 'sean', m: '2011 · Tomahawk Technique' },
  { t: 'So Fine', a: 'sean', m: '2009 · Imperial Blaze' },
  { t: "Ever Blazin'", a: 'sean', m: '2005 · The Trinity' },
  { t: 'Timber', a: 'pit', m: '2013 · Meltdown' },
  { t: 'Give Me Everything', a: 'pit', m: '2011 · Planet Pit' },
  { t: 'International Love', a: 'pit', m: '2011 · Planet Pit' },
  { t: 'Hotel Room Service', a: 'pit', m: '2009 · Rebelution' },
  { t: 'I Know You Want Me', a: 'pit', m: '2009 · Rebelution' },
  { t: 'Fireball', a: 'pit', m: '2014 · Globalization' },
  { t: 'Feel This Moment', a: 'pit', m: '2012 · Global Warming' },
  { t: 'Rain Over Me', a: 'pit', m: '2011 · Planet Pit' },
  { t: 'Time of Our Lives', a: 'pit', m: '2014 · Globalization' },
  { t: "Don't Stop the Party", a: 'pit', m: '2012 · Global Warming' },
] as const
