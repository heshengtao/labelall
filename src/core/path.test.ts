import { describe, expect, it } from 'vitest'

import {
  fileBasename,
  fileDirname,
  fileExtension,
  fileStem,
  imagesPathToLabelsPath,
  joinPath,
  replaceExtension,
} from './path'

describe('path helpers', () => {
  it('joins segments, dropping empties and duplicate separators', () => {
    expect(joinPath('images', 'train', 'a.jpg')).toBe('images/train/a.jpg')
    expect(joinPath('', 'a.jpg')).toBe('a.jpg')
    expect(joinPath('a/', '/b')).toBe('a/b')
    expect(joinPath('')).toBe('')
  })

  it('splits a path into its parts', () => {
    expect(fileBasename('a/b/c.jpg')).toBe('c.jpg')
    expect(fileDirname('a/b/c.jpg')).toBe('a/b')
    expect(fileDirname('c.jpg')).toBe('')
    expect(fileExtension('a/b/c.JPG')).toBe('.jpg')
    expect(fileExtension('noext')).toBe('')
    expect(fileStem('a/b/c.tar.gz')).toBe('c.tar')
  })

  it('replaces the extension', () => {
    expect(replaceExtension('a/b/c.jpg', '.txt')).toBe('a/b/c.txt')
    expect(replaceExtension('a/b/c', '.txt')).toBe('a/b/c.txt')
  })

  it('resolves the label file for the last /images/ segment', () => {
    expect(imagesPathToLabelsPath('dataset/images/train/a.jpg')).toBe('dataset/labels/train/a.txt')
    expect(imagesPathToLabelsPath('images/train/a.jpg')).toBe('labels/train/a.txt')
    expect(imagesPathToLabelsPath('a.jpg')).toBe('labels/a.txt')
  })
})
