# -*- coding: utf-8 -*-
#  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>
#
#  Redistribution and use in source and binary forms, with or without
#  modification, are permitted provided that the following conditions are met:
#
#    * Redistributions of source code must retain the above copyright
#      notice, this list of conditions and the following disclaimer.
#    * Redistributions in binary form must reproduce the above copyright
#      notice, this list of conditions and the following disclaimer in the
#      documentation and/or other materials provided with the distribution.
#
#  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
#  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
#  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
#  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
#  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
#  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
#  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
#  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
#  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
#  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

gulp   = require 'gulp'
coffee = require 'gulp-coffee'
mocha  = require 'gulp-mocha'
require 'coffee-script/register'

SOURCE = [
    'src/*.coffee'
]

DEST = 'lib'

TEST = [
    'test/*.coffee'
]

gulp.task 'build', ->
    gulp.src(SOURCE)
    .pipe coffee(
        header: yes
    )
    .pipe gulp.dest(DEST)

gulp.task 'watch', [ 'build' ], ->
    gulp.watch SOURCE, [ 'build' ]

gulp.task 'default', [ 'build' ]

gulp.task 'test', ->
    gulp.src(TEST)
    .pipe(mocha(
        reporter: 'spec',
        timeout: 100000
    ))

# vim: set sw=4 ts=4 et tw=80 :
